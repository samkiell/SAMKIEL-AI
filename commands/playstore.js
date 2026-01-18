/**
 * Play Store / APK Download Command
 * Downloads APKs from Play Store links or names
 */

const axios = require("axios");
const { sendText } = require("../lib/sendResponse");

const TIMEOUT = 60000;

async function playstoreCommand(sock, chatId, message, args) {
  const query = args.join(" ").trim();

  if (!query) {
    return await sendText(
      sock,
      chatId,
      "🎮 *Play Store Download*\n\n" +
        "*Usage:* .playstore <app name/link>\n\n" +
        "*Example:*\n" +
        ".playstore WhatsApp",
    );
  }

  try {
    await sendText(sock, chatId, "🎮 *Searching and Downloading APK...*");

    const apis = [
      {
        name: "Kord APK",
        url: `https://api.kord.live/api/apk?id=${encodeURIComponent(query)}`,
        extract: (d) => ({
          url: d?.download || d?.result?.download || d?.url,
          name: d?.name || d?.result?.name || "App",
          size: d?.size || d?.result?.size || "Unknown",
        }),
      },
      {
        name: "Siputzx APK",
        url: `https://api.siputzx.my.id/api/apk/download?id=${encodeURIComponent(query)}`,
        extract: (d) => ({
          url: d?.data?.download || d?.data?.url || d?.result?.url,
          name: d?.data?.name || d?.result?.name || "App",
          size: d?.data?.size || d?.result?.size || "Unknown",
        }),
      },
      {
        name: "Siputzx Search + DL",
        url: `https://api.siputzx.my.id/api/apk/search?q=${encodeURIComponent(query)}`,
        fn: async (q) => {
          const search = await axios.get(
            `https://api.siputzx.my.id/api/apk/search?q=${encodeURIComponent(q)}`,
          );
          if (search.data?.data?.[0]?.id) {
            const dl = await axios.get(
              `https://api.siputzx.my.id/api/apk/download?id=${search.data.data[0].id}`,
            );
            return {
              url: dl.data?.data?.download || dl.data?.data?.url,
              name: dl.data?.data?.name || search.data.data[0].name,
              size: dl.data?.data?.size,
            };
          }
          return null;
        },
      },
    ];

    let apk = null;
    for (const api of apis) {
      try {
        if (api.fn) {
          apk = await api.fn(query);
        } else {
          const { data } = await axios.get(api.url, { timeout: TIMEOUT });
          apk = api.extract(data);
        }
        if (apk?.url) break;
      } catch (e) {
        console.log(`PlayStore: ${api.name} failed`);
      }
    }

    if (!apk?.url) {
      return await sendText(
        sock,
        chatId,
        "❌ Could not find or download this app. Try a more specific name.",
      );
    }

    // Send APK as document
    await sock.sendMessage(
      chatId,
      {
        document: { url: apk.url },
        mimetype: "application/vnd.android.package-archive",
        fileName: `${apk.name.replace(/\s/g, "_")}.apk`,
        caption: `🎮 *${apk.name}*\n📦 *Size:* ${apk.size || "Unknown"}\n\n*Powered by SAMKIEL BOT*`,
      },
      { quoted: message },
    );
  } catch (error) {
    console.error("PlayStore Error:", error.message);
    await sendText(sock, chatId, "❌ Failed to download from Play Store.");
  }
}

module.exports = playstoreCommand;
