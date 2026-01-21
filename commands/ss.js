const fetch = require("node-fetch");
const axios = require("axios"); // Use axios for better error handling
const { loadPrefix } = require("../lib/prefix");
const { sendReaction } = require("../lib/reactions");

async function handleSsCommand(sock, chatId, message, match) {
  const currentPrefix = loadPrefix();
  const p = currentPrefix === "off" ? "" : currentPrefix;

  if (!match) {
    return await sock.sendMessage(
      chatId,
      {
        text: `*SCREENSHOT TOOL*\n\nUsage: *${p}ss <url>*\nExample: ${p}ss https://google.com`,
        ...global.channelInfo,
      },
      { quoted: message },
    );
  }

  let url = match.trim();
  if (!url.startsWith("http")) url = `https://${url}`;

  await sendReaction(sock, message, "📸");

  try {
    // 1. Try Microlink (High Quality)
    try {
      const res = await axios.get(
        `https://api.microlink.io/?url=${encodeURIComponent(url)}&screenshot=true&meta=false`,
        { timeout: 10000 },
      );
      if (res.data?.status === "success" && res.data?.screenshot?.url) {
        return await sock.sendMessage(
          chatId,
          {
            image: { url: res.data.screenshot.url },
            caption: `📸 Screenshot of ${url}\n\n*Powered by SAMKIEL BOT*`,
            ...global.channelInfo,
          },
          { quoted: message },
        );
      }
    } catch (e) {
      console.log("SS: Microlink failed, trying Thum.io");
    }

    // 2. Fallback to Thum.io (Reliable, direct image)
    const thumUrl = `https://image.thum.io/get/width/1920/crop/1080/noanimate/${url}`;

    // Check if Thum.io returns a valid image (status 200)
    const check = await fetch(thumUrl, { method: "HEAD" });
    if (check.ok) {
      return await sock.sendMessage(
        chatId,
        {
          image: { url: thumUrl },
          caption: `📸 Screenshot of ${url}\n\n*Powered by SAMKIEL BOT*`,
          ...global.channelInfo,
        },
        { quoted: message },
      );
    }

    throw new Error("All Screenshot APIs failed");
  } catch (error) {
    console.error("SS Command Error:", error);
    await sock.sendMessage(
      chatId,
      {
        text: "❌ Failed to capture screenshot.\n\n*Powered by SAMKIEL BOT*",
        ...global.channelInfo,
      },
      { quoted: message },
    );
  }
}

module.exports = { handleSsCommand };
