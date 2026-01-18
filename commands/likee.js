/**
 * Likee Download Command
 * Downloads videos from Likee
 */

const axios = require("axios");
const { sendText } = require("../lib/sendResponse");

const TIMEOUT = 30000;

async function likeeCommand(sock, chatId, message, args) {
  const url = args[0]?.trim();

  if (
    !url ||
    (!url.includes("likee.video") && !url.includes("l.likee.video"))
  ) {
    return await sendText(
      sock,
      chatId,
      "🎯 *Likee Download*\n\n" +
        "*Usage:* .likee <link>\n\n" +
        "*Example:*\n" +
        ".likee https://likee.video/...",
    );
  }

  try {
    await sendText(sock, chatId, "🎯 *Downloading from Likee...*");

    const apis = [
      {
        name: "Siputzx",
        url: `https://api.siputzx.my.id/api/d/likee?url=${encodeURIComponent(url)}`,
        extract: (d) => d?.data?.url || d?.result,
      },
      {
        name: "Gifted",
        url: `https://api.giftedtech.my.id/api/download/likee?apikey=gifted&url=${encodeURIComponent(url)}`,
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
        console.log(`Likee: ${api.name} failed`);
      }
    }

    if (!videoUrl) {
      return await sendText(sock, chatId, "❌ Could not download from Likee.");
    }

    await sock.sendMessage(
      chatId,
      {
        video: { url: videoUrl },
        caption: "🎯 *Likee Video*",
      },
      { quoted: message },
    );
  } catch (error) {
    console.error("Likee Error:", error.message);
    await sendText(sock, chatId, "❌ Failed to download from Likee.");
  }
}

module.exports = likeeCommand;
