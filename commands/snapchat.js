/**
 * Snapchat Download Command
 * Downloads videos from Snapchat links
 */

const axios = require("axios");
const { sendText } = require("../lib/sendResponse");

const TIMEOUT = 30000;

async function snapchatCommand(sock, chatId, message, args) {
  const url = args[0]?.trim();

  if (!url || !url.includes("snapchat.com")) {
    return await sendText(
      sock,
      chatId,
      "👻 *Snapchat Download*\n\n" +
        "*Usage:* .snapchat <link>\n\n" +
        "*Example:*\n" +
        ".snapchat https://www.snapchat.com/...",
    );
  }

  try {
    await sendText(sock, chatId, "👻 *Downloading from Snapchat...*");

    const apis = [
      {
        name: "Siputzx",
        url: `https://api.siputzx.my.id/api/d/snapchat?url=${encodeURIComponent(url)}`,
        extract: (d) => d?.data?.url || d?.result,
      },
      {
        name: "Gifted",
        url: `https://api.giftedtech.my.id/api/download/snapchat?apikey=gifted&url=${encodeURIComponent(url)}`,
        extract: (d) => d?.result?.url || d?.result,
      },
    ];

    let videoUrl = null;
    for (const api of apis) {
      try {
        const { data } = await axios.get(api.url, { timeout: TIMEOUT });
        videoUrl = api.extract(data);
        if (videoUrl) break;
      } catch (e) {
        console.log(`Snapchat: ${api.name} failed`);
      }
    }

    if (!videoUrl) {
      return await sendText(
        sock,
        chatId,
        "❌ Could not download from Snapchat.",
      );
    }

    await sock.sendMessage(
      chatId,
      {
        video: { url: videoUrl },
        caption: "👻 *Snapchat Video*",
      },
      { quoted: message },
    );
  } catch (error) {
    console.error("Snapchat Error:", error.message);
    await sendText(sock, chatId, "❌ Failed to download from Snapchat.");
  }
}

module.exports = snapchatCommand;
