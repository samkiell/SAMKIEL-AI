/**
 * Reddit Download Command
 * Downloads videos/images from Reddit links
 */

const axios = require("axios");
const { sendText } = require("../lib/sendResponse");

const TIMEOUT = 30000;

async function redditCommand(sock, chatId, message, args) {
  const url = args[0]?.trim();

  if (!url || !url.includes("reddit.com")) {
    return await sendText(
      sock,
      chatId,
      "🔴 *Reddit Download*\n\n" +
        "*Usage:* .reddit <link>\n\n" +
        "*Example:*\n" +
        ".reddit https://www.reddit.com/r/...",
    );
  }

  try {
    await sendText(sock, chatId, "🔴 *Downloading from Reddit...*");

    const apis = [
      {
        name: "Siputzx",
        url: `https://api.siputzx.my.id/api/d/reddit?url=${encodeURIComponent(url)}`,
        extract: (d) => ({
          url: d?.data?.url || d?.result,
          type: d?.data?.type || "video",
        }),
      },
      {
        name: "RyzenDesu",
        url: `https://api.ryzendesu.vip/api/downloader/reddit?url=${encodeURIComponent(url)}`,
        extract: (d) => ({ url: d?.result || d?.url, type: "video" }),
      },
    ];

    let media = null;
    for (const api of apis) {
      try {
        const { data } = await axios.get(api.url, { timeout: TIMEOUT });
        media = api.extract(data);
        if (media?.url) break;
      } catch (e) {
        console.log(`Reddit: ${api.name} failed`);
      }
    }

    if (!media?.url) {
      return await sendText(sock, chatId, "❌ Could not download from Reddit.");
    }

    if (media.type === "image" || media.url.match(/\.(jpg|jpeg|png|gif)$/i)) {
      await sock.sendMessage(
        chatId,
        {
          image: { url: media.url },
          caption: "🔴 *Reddit Image*",
        },
        { quoted: message },
      );
    } else {
      await sock.sendMessage(
        chatId,
        {
          video: { url: media.url },
          caption: "🔴 *Reddit Video*",
        },
        { quoted: message },
      );
    }
  } catch (error) {
    console.error("Reddit Error:", error.message);
    await sendText(sock, chatId, "❌ Failed to download from Reddit.");
  }
}

module.exports = redditCommand;
