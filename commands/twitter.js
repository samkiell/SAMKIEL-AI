/**
 * Twitter/X Video Download Command
 * Downloads videos from Twitter/X links
 */

const axios = require("axios");
const { sendText } = require("../lib/sendResponse");

const TIMEOUT = 30000;

/**
 * Validate Twitter/X URL
 */
function isTwitterUrl(url) {
  return /(?:twitter\.com|x\.com)\/\w+\/status\/\d+/.test(url);
}

/**
 * API 1: Twitter Video Downloader (Primary)
 */
async function downloadViaApi1(url) {
  const apiUrl = `https://api.siputzx.my.id/api/d/twitter?url=${encodeURIComponent(url)}`;
  const { data } = await axios.get(apiUrl, { timeout: TIMEOUT });

  if (data?.status && data?.data?.url) {
    return {
      videoUrl: data.data.url,
      thumbnail: data.data.thumbnail,
      caption: data.data.desc || "Twitter Video",
    };
  }
  throw new Error("No video found");
}

/**
 * API 2: Alternative Twitter Downloader
 */
async function downloadViaApi2(url) {
  const apiUrl = `https://api.giftedtech.my.id/api/download/twitter?apikey=gifted&url=${encodeURIComponent(url)}`;
  const { data } = await axios.get(apiUrl, { timeout: TIMEOUT });

  if (data?.result?.url || data?.result?.video) {
    return {
      videoUrl: data.result.url || data.result.video,
      thumbnail: data.result.thumbnail,
      caption: data.result.caption || "Twitter Video",
    };
  }
  throw new Error("No video found");
}

/**
 * API 3: Cobalt API
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
      caption: "Twitter Video",
    };
  }
  throw new Error("No video found");
}

async function twitterCommand(sock, chatId, message, args) {
  const url = args[0]?.trim();

  if (!url || !isTwitterUrl(url)) {
    return await sendText(
      sock,
      chatId,
      "🐦 *Twitter/X Download*\n\n" +
        "*Usage:* .twitter <link>\n\n" +
        "*Example:*\n" +
        ".twitter https://twitter.com/user/status/123456",
    );
  }

  try {
    await sendText(sock, chatId, "🐦 *Downloading from Twitter...*");

    let result = null;

    // Try API 1
    try {
      result = await downloadViaApi1(url);
    } catch (e) {
      console.log("Twitter: API 1 failed");
    }

    // Try API 2
    if (!result) {
      try {
        result = await downloadViaApi2(url);
      } catch (e) {
        console.log("Twitter: API 2 failed");
      }
    }

    // Try Cobalt
    if (!result) {
      try {
        result = await downloadViaCobalt(url);
      } catch (e) {
        console.log("Twitter: Cobalt failed");
      }
    }

    if (!result) {
      return await sendText(
        sock,
        chatId,
        "❌ Could not download video. The tweet might not contain a video or the API is down.",
      );
    }

    // Send video
    await sock.sendMessage(
      chatId,
      {
        video: { url: result.videoUrl },
        caption: `🐦 ${result.caption}`,
      },
      { quoted: message },
    );
  } catch (error) {
    console.error("Twitter Error:", error.message);
    await sendText(sock, chatId, "❌ Failed to download from Twitter.");
  }
}

module.exports = twitterCommand;
