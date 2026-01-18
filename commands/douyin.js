/**
 * Douyin Download Command
 * Downloads videos from Douyin (Chinese TikTok)
 */

const axios = require("axios");
const { sendText } = require("../lib/sendResponse");

const TIMEOUT = 30000;

async function douyinCommand(sock, chatId, message, args) {
  const url = args[0]?.trim();

  if (!url || (!url.includes("douyin.com") && !url.includes("iesdouyin.com"))) {
    return await sendText(
      sock,
      chatId,
      "🎵 *Douyin Download*\n\n" +
        "*Usage:* .douyin <link>\n\n" +
        "*Example:*\n" +
        ".douyin https://www.douyin.com/video/...",
    );
  }

  try {
    await sendText(sock, chatId, "🎵 *Downloading from Douyin...*");

    const apis = [
      {
        name: "Siputzx",
        url: `https://api.siputzx.my.id/api/d/douyin?url=${encodeURIComponent(url)}`,
        extract: (d) => d?.data?.url || d?.result,
      },
      {
        name: "Cobalt",
        type: "post",
        url: "https://api.cobalt.tools/api/json",
        body: { url, vCodec: "h264", vQuality: "720" },
        extract: (d) => d?.url,
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
        console.log(`Douyin: ${api.name} failed`);
      }
    }

    if (!videoUrl) {
      return await sendText(sock, chatId, "❌ Could not download from Douyin.");
    }

    await sock.sendMessage(
      chatId,
      {
        video: { url: videoUrl },
        caption: "🎵 *Douyin Video*",
      },
      { quoted: message },
    );
  } catch (error) {
    console.error("Douyin Error:", error.message);
    await sendText(sock, chatId, "❌ Failed to download from Douyin.");
  }
}

module.exports = douyinCommand;
