/**
 * Pinterest Download Command
 * Downloads images/videos from Pinterest links
 */

const axios = require("axios");
const { sendText } = require("../lib/sendResponse");

const TIMEOUT = 20000;

/**
 * Validate Pinterest URL
 */
function isPinterestUrl(url) {
  return /(?:pinterest\.com|pin\.it)/.test(url);
}

/**
 * API 1: Pinterest Downloader
 */
async function downloadViaApi1(url) {
  const apiUrl = `https://api.siputzx.my.id/api/d/pinterest?url=${encodeURIComponent(url)}`;
  const { data } = await axios.get(apiUrl, { timeout: TIMEOUT });

  if (data?.status && data?.data) {
    return {
      mediaUrl: data.data.image || data.data.video,
      type: data.data.video ? "video" : "image",
      title: data.data.title || "Pinterest",
    };
  }
  throw new Error("No media found");
}

/**
 * API 2: Alternative Pinterest Downloader
 */
async function downloadViaApi2(url) {
  const apiUrl = `https://api.giftedtech.my.id/api/download/pinterest?apikey=gifted&url=${encodeURIComponent(url)}`;
  const { data } = await axios.get(apiUrl, { timeout: TIMEOUT });

  if (data?.result) {
    const mediaUrl = data.result.video || data.result.image || data.result.url;
    return {
      mediaUrl,
      type: data.result.video ? "video" : "image",
      title: data.result.title || "Pinterest",
    };
  }
  throw new Error("No media found");
}

async function pinterestCommand(sock, chatId, message, args) {
  const url = args[0]?.trim();

  if (!url || !isPinterestUrl(url)) {
    return await sendText(
      sock,
      chatId,
      "📌 *Pinterest Download*\n\n" +
        "*Usage:* .pinterest <link>\n\n" +
        "*Example:*\n" +
        ".pinterest https://pinterest.com/pin/123...\n" +
        ".pinterest https://pin.it/abc123",
    );
  }

  try {
    await sendText(sock, chatId, "📌 *Downloading from Pinterest...*");

    let result = null;

    // Try API 1
    try {
      result = await downloadViaApi1(url);
    } catch (e) {
      console.log("Pinterest: API 1 failed");
    }

    // Try API 2
    if (!result) {
      try {
        result = await downloadViaApi2(url);
      } catch (e) {
        console.log("Pinterest: API 2 failed");
      }
    }

    if (!result || !result.mediaUrl) {
      return await sendText(
        sock,
        chatId,
        "❌ Could not download from Pinterest.",
      );
    }

    // Send media based on type
    if (result.type === "video") {
      await sock.sendMessage(
        chatId,
        {
          video: { url: result.mediaUrl },
          caption: `📌 ${result.title}`,
        },
        { quoted: message },
      );
    } else {
      await sock.sendMessage(
        chatId,
        {
          image: { url: result.mediaUrl },
          caption: `📌 ${result.title}`,
        },
        { quoted: message },
      );
    }
  } catch (error) {
    console.error("Pinterest Error:", error.message);
    await sendText(sock, chatId, "❌ Failed to download from Pinterest.");
  }
}

module.exports = pinterestCommand;
