/**
 * Bilibili Download Command
 * Downloads videos from Bilibili
 */

const axios = require("axios");
const { sendText } = require("../lib/sendResponse");

const TIMEOUT = 60000;

async function bilibiliCommand(sock, chatId, message, args) {
  const url = args[0]?.trim();

  if (!url || !url.includes("bilibili.com")) {
    return await sendText(
      sock,
      chatId,
      "📺 *Bilibili Download*\n\n" +
        "*Usage:* .bilibili <link>\n\n" +
        "*Example:*\n" +
        ".bilibili https://www.bilibili.com/video/BV...",
    );
  }

  try {
    await sendText(sock, chatId, "📺 *Downloading from Bilibili...*");

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
        url: `https://api.siputzx.my.id/api/d/bilibili?url=${encodeURIComponent(url)}`,
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
        console.log(`Bilibili: ${api.name} failed`);
      }
    }

    if (!videoUrl) {
      return await sendText(
        sock,
        chatId,
        "❌ Could not download from Bilibili.",
      );
    }

    await sock.sendMessage(
      chatId,
      {
        video: { url: videoUrl },
        caption: "📺 *Bilibili Video*",
      },
      { quoted: message },
    );
  } catch (error) {
    console.error("Bilibili Error:", error.message);
    await sendText(sock, chatId, "❌ Failed to download from Bilibili.");
  }
}

module.exports = bilibiliCommand;
