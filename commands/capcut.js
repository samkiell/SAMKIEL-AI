/**
 * Capcut Download Command
 * Downloads videos from Capcut templates
 */

const axios = require("axios");
const { sendText } = require("../lib/sendResponse");

const TIMEOUT = 30000;

async function capcutCommand(sock, chatId, message, args) {
  const url = args[0]?.trim();

  if (!url || !url.includes("capcut.com")) {
    return await sendText(
      sock,
      chatId,
      "🎬 *CapCut Download*\n\n" +
        "*Usage:* .capcut <link>\n\n" +
        "*Example:*\n" +
        ".capcut https://www.capcut.com/template/...",
    );
  }

  try {
    await sendText(sock, chatId, "🎬 *Downloading from CapCut...*");

    const apis = [
      {
        name: "Siputzx",
        url: `https://api.siputzx.my.id/api/d/capcut?url=${encodeURIComponent(url)}`,
        extract: (d) => d?.data?.url || d?.result,
      },
      {
        name: "Gifted",
        url: `https://api.giftedtech.my.id/api/download/capcut?apikey=gifted&url=${encodeURIComponent(url)}`,
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
        console.log(`CapCut: ${api.name} failed`);
      }
    }

    if (!videoUrl) {
      return await sendText(sock, chatId, "❌ Could not download from CapCut.");
    }

    await sock.sendMessage(
      chatId,
      {
        video: { url: videoUrl },
        caption: "🎬 *CapCut Template*",
      },
      { quoted: message },
    );
  } catch (error) {
    console.error("CapCut Error:", error.message);
    await sendText(sock, chatId, "❌ Failed to download from CapCut.");
  }
}

module.exports = capcutCommand;
