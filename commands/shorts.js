/**
 * YouTube Shorts Download Command
 * Downloads YouTube Shorts videos
 */

const axios = require("axios");
const { sendText } = require("../lib/sendResponse");

const TIMEOUT = 60000;

/**
 * Validate YouTube/Shorts URL
 */
function isYouTubeUrl(url) {
  return /(?:youtube\.com|youtu\.be|youtube\.com\/shorts)/.test(url);
}

/**
 * Convert shorts URL to regular if needed
 */
function normalizeUrl(url) {
  // Handle shorts URLs
  const shortsMatch = url.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]+)/);
  if (shortsMatch) {
    return `https://www.youtube.com/watch?v=${shortsMatch[1]}`;
  }
  return url;
}

/**
 * API 1: David Cyril (Primary)
 */
async function downloadViaApi1(url) {
  const res = await axios.get(
    `https://apis.davidcyril.name.ng/download/ytvideo?url=${encodeURIComponent(url)}&apikey=harriet`,
    { timeout: TIMEOUT },
  );
  if (res.data?.success && res.data?.result?.download_url) {
    return {
      videoUrl: res.data.result.download_url,
      title: res.data.result.title || "YouTube Video",
      thumbnail: res.data.result.thumbnail,
    };
  }
  throw new Error("No video");
}

/**
 * API 2: Siputzx
 */
async function downloadViaApi2(url) {
  const res = await axios.get(
    `https://api.siputzx.my.id/api/d/ytmp4?url=${encodeURIComponent(url)}`,
    { timeout: TIMEOUT },
  );
  if (res.data?.status && res.data?.data?.dl) {
    return {
      videoUrl: res.data.data.dl,
      title: res.data.data.title || "YouTube Video",
      thumbnail: res.data.data.thumb,
    };
  }
  throw new Error("No video");
}

/**
 * API 3: Cobalt
 */
async function downloadViaCobalt(url) {
  const res = await axios.post(
    "https://api.cobalt.tools/api/json",
    { url, vCodec: "h264", vQuality: "720" },
    {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      timeout: TIMEOUT,
    },
  );
  if (res.data?.url) {
    return {
      videoUrl: res.data.url,
      title: "YouTube Video",
    };
  }
  throw new Error("No video");
}

async function shortsCommand(sock, chatId, message, args) {
  const url = args[0]?.trim();

  if (!url || !isYouTubeUrl(url)) {
    return await sendText(
      sock,
      chatId,
      "📹 *YouTube Shorts Download*\n\n" +
        "*Usage:* .shorts <link>\n\n" +
        "*Example:*\n" +
        ".shorts https://youtube.com/shorts/abc123\n" +
        ".shorts https://youtu.be/abc123",
    );
  }

  try {
    await sendText(sock, chatId, "📹 *Downloading YouTube Shorts...*");

    const normalizedUrl = normalizeUrl(url);
    let result = null;

    // Try API 1
    try {
      result = await downloadViaApi1(normalizedUrl);
    } catch (e) {
      console.log("Shorts: API 1 failed");
    }

    // Try API 2
    if (!result) {
      try {
        result = await downloadViaApi2(normalizedUrl);
      } catch (e) {
        console.log("Shorts: API 2 failed");
      }
    }

    // Try Cobalt
    if (!result) {
      try {
        result = await downloadViaCobalt(normalizedUrl);
      } catch (e) {
        console.log("Shorts: Cobalt failed");
      }
    }

    if (!result) {
      return await sendText(
        sock,
        chatId,
        "❌ Could not download video. Try again later.",
      );
    }

    // Send video
    await sock.sendMessage(
      chatId,
      {
        video: { url: result.videoUrl },
        caption: `📹 *${result.title}*`,
      },
      { quoted: message },
    );
  } catch (error) {
    console.error("Shorts Error:", error.message);
    await sendText(sock, chatId, "❌ Failed to download YouTube Shorts.");
  }
}

module.exports = shortsCommand;
