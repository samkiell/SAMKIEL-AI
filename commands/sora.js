/**
 * Sora Command - AI Video Generation
 * Multiple fallback APIs
 */

const axios = require("axios");
const { loadPrefix } = require("../lib/prefix");
const { sendText } = require("../lib/sendResponse");

const TIMEOUT = 120000; // 2 minutes for video generation

/**
 * Video Generation APIs (Multiple Fallbacks)
 */
const VIDEO_APIS = [
  {
    name: "Okatsu Rolezy",
    url: (prompt) =>
      `https://okatsu-rolezapiiz.vercel.app/ai/txt2video?text=${encodeURIComponent(prompt)}`,
    extract: (d) => d?.videoUrl || d?.result || d?.data?.videoUrl,
  },
  {
    name: "Siputzx Text2Video",
    url: (prompt) =>
      `https://api.siputzx.my.id/api/ai/text2video?prompt=${encodeURIComponent(prompt)}`,
    extract: (d) => d?.data?.url || d?.result || d?.url,
  },
  {
    name: "Gifted AI Video",
    url: (prompt) =>
      `https://api.giftedtech.my.id/api/ai/text2video?apikey=gifted&prompt=${encodeURIComponent(prompt)}`,
    extract: (d) => d?.result?.url || d?.result,
  },
  {
    name: "RyzenDesu Video",
    url: (prompt) =>
      `https://api.ryzendesu.vip/api/ai/text2video?text=${encodeURIComponent(prompt)}`,
    extract: (d) => d?.result || d?.url,
  },
];

async function soraCommand(sock, chatId, message) {
  try {
    const currentPrefix = loadPrefix();
    const p = currentPrefix === "off" ? "" : currentPrefix;

    const rawText =
      message.message?.conversation?.trim() ||
      message.message?.extendedTextMessage?.text?.trim() ||
      message.message?.imageMessage?.caption?.trim() ||
      message.message?.videoMessage?.caption?.trim() ||
      "";

    // Extract prompt
    const used = (rawText || "").split(/\s+/)[0] || `${p}sora`;
    const args = rawText.slice(used.length).trim();
    const quoted =
      message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const quotedText =
      quoted?.conversation || quoted?.extendedTextMessage?.text || "";
    const input = args || quotedText;

    if (!input) {
      return await sock.sendMessage(
        chatId,
        {
          text: `📹 *AI Video Generator*\n\nProvide a prompt.\n\n*Example:*\n${p}sora anime girl with blue hair walking in rain\n\n_Note: Video generation takes 1-2 minutes_`,
          ...global.channelInfo,
        },
        { quoted: message },
      );
    }

    // Send processing message
    await sock.sendMessage(
      chatId,
      {
        text: `📹 *Generating Video...*\n\nPrompt: _${input}_\n\n⏳ This may take 1-2 minutes...`,
        ...global.channelInfo,
      },
      { quoted: message },
    );

    let videoUrl = null;
    let usedApi = "";

    // Try each API
    for (const api of VIDEO_APIS) {
      try {
        console.log(`Sora: Trying ${api.name}...`);
        const { data } = await axios.get(api.url(input), {
          timeout: TIMEOUT,
          headers: { "user-agent": "Mozilla/5.0" },
        });

        const url = api.extract(data);
        if (url && typeof url === "string" && url.startsWith("http")) {
          videoUrl = url;
          usedApi = api.name;
          break;
        }
      } catch (e) {
        console.log(`Sora: ${api.name} failed - ${e.message}`);
      }
    }

    if (!videoUrl) {
      return await sock.sendMessage(
        chatId,
        {
          text: "❌ All video generation APIs are busy. Try again in a few minutes or try a simpler prompt.",
          ...global.channelInfo,
        },
        { quoted: message },
      );
    }

    // Send video
    await sock.sendMessage(
      chatId,
      {
        video: { url: videoUrl },
        mimetype: "video/mp4",
        caption: `📹 *AI Generated Video*\n\n_Prompt: ${input}_`,
        ...global.channelInfo,
      },
      { quoted: message },
    );
  } catch (error) {
    console.error("[SORA] error:", error?.message || error);
    await sock.sendMessage(
      chatId,
      {
        text: "❌ Failed to generate video. Try a different prompt.",
        ...global.channelInfo,
      },
      { quoted: message },
    );
  }
}

module.exports = soraCommand;
