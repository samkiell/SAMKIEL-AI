/**
 * Threads Download Command
 * Downloads from Meta Threads
 */

const axios = require("axios");
const { sendText } = require("../lib/sendResponse");

const TIMEOUT = 30000;

async function threadsCommand(sock, chatId, message, args) {
  const url = args[0]?.trim();

  if (!url || !url.includes("threads.net")) {
    return await sendText(
      sock,
      chatId,
      "🧵 *Threads Download*\n\n" +
        "*Usage:* .threads <link>\n\n" +
        "*Example:*\n" +
        ".threads https://www.threads.net/@user/post/...",
    );
  }

  try {
    await sendText(sock, chatId, "🧵 *Downloading from Threads...*");

    const apis = [
      {
        name: "Siputzx",
        url: `https://api.siputzx.my.id/api/d/threads?url=${encodeURIComponent(url)}`,
        extract: (d) => d?.data || d?.result,
      },
      {
        name: "Gifted",
        url: `https://api.giftedtech.my.id/api/download/threads?apikey=gifted&url=${encodeURIComponent(url)}`,
        extract: (d) => d?.result,
      },
    ];

    let media = null;
    for (const api of apis) {
      try {
        const { data } = await axios.get(api.url, { timeout: TIMEOUT });
        media = api.extract(data);
        if (media) break;
      } catch (e) {
        console.log(`Threads: ${api.name} failed`);
      }
    }

    if (!media) {
      return await sendText(
        sock,
        chatId,
        "❌ Could not download from Threads.",
      );
    }

    const mediaUrl = media.video || media.image || media.url;
    const isVideo = media.video || (mediaUrl && mediaUrl.includes(".mp4"));

    if (isVideo) {
      await sock.sendMessage(
        chatId,
        {
          video: { url: mediaUrl },
          caption: `🧵 *Threads*\n\n${media.caption || ""}`.trim(),
        },
        { quoted: message },
      );
    } else {
      await sock.sendMessage(
        chatId,
        {
          image: { url: mediaUrl },
          caption: `🧵 *Threads*\n\n${media.caption || ""}`.trim(),
        },
        { quoted: message },
      );
    }
  } catch (error) {
    console.error("Threads Error:", error.message);
    await sendText(sock, chatId, "❌ Failed to download from Threads.");
  }
}

module.exports = threadsCommand;
