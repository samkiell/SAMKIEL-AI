/**
 * Vimeo Download Command
 * Downloads videos from Vimeo
 */

const axios = require("axios");
const { sendText } = require("../lib/sendResponse");

const TIMEOUT = 60000;

async function vimeoCommand(sock, chatId, message, args) {
  const url = args[0]?.trim();

  if (!url || !url.includes("vimeo.com")) {
    return await sendText(
      sock,
      chatId,
      "🎬 *Vimeo Download*\n\n" +
        "*Usage:* .vimeo <link>\n\n" +
        "*Example:*\n" +
        ".vimeo https://vimeo.com/123456789",
    );
  }

  try {
    await sendText(sock, chatId, "🎬 *Downloading from Vimeo...*");

    const apis = [
      {
        name: "Cobalt",
        type: "post",
        url: "https://api.cobalt.tools/api/json",
        body: { url, vCodec: "h264", vQuality: "720" },
        extract: (d) => d?.url,
      },
      {
        name: "Siputzx",
        url: `https://api.siputzx.my.id/api/d/vimeo?url=${encodeURIComponent(url)}`,
        extract: (d) => d?.data?.url || d?.result,
      },
    ];

    let videoUrl = null;
    for (const api of apis) {
      try {
        let response;
        if (api.type === "post") {
          response = await axios.post(api.url, api.body, {
            headers: { "Content-Type": "application/json" },
            timeout: TIMEOUT,
          });
        } else {
          response = await axios.get(api.url, { timeout: TIMEOUT });
        }
        videoUrl = api.extract(response.data);
        if (videoUrl) break;
      } catch (e) {
        console.log(`Vimeo: ${api.name} failed`);
      }
    }

    if (!videoUrl) {
      return await sendText(sock, chatId, "❌ Could not download from Vimeo.");
    }

    await sock.sendMessage(
      chatId,
      {
        video: { url: videoUrl },
        caption: "🎬 *Vimeo Video*",
      },
      { quoted: message },
    );
  } catch (error) {
    console.error("Vimeo Error:", error.message);
    await sendText(sock, chatId, "❌ Failed to download from Vimeo.");
  }
}

module.exports = vimeoCommand;
