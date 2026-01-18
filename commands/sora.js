const axios = require("axios");

const { loadPrefix } = require("../lib/prefix");

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

    // Extract prompt after command keyword or use quoted text
    const used = (rawText || "").split(/\s+/)[0] || `${p}sora`;
    const args = rawText.slice(used.length).trim();
    const quoted =
      message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const quotedText =
      quoted?.conversation || quoted?.extendedTextMessage?.text || "";
    const input = args || quotedText;

    if (!input) {
      await sock.sendMessage(
        chatId,
        {
          text: `Provide a prompt. Example: ${p}sora anime girl with short blue hair\n\n*Powered by SAMKIEL BOT*`,
        },
        { quoted: message },
      );
      return;
    }

    // Thinking... reaction
    await sock.sendMessage(chatId, { react: { text: "⏳", key: message.key } });

    const apiUrl = `https://okatsu-rolezapiiz.vercel.app/ai/txt2video?text=${encodeURIComponent(input)}`;
    const { data } = await axios.get(apiUrl, {
      timeout: 120000, // Increased timeout for video generation
      headers: { "user-agent": "Mozilla/5.0" },
    });

    const videoUrl = data?.videoUrl || data?.result || data?.data?.videoUrl;
    if (!videoUrl) {
      throw new Error("No videoUrl in API response");
    }

    await sock.sendMessage(
      chatId,
      {
        video: { url: videoUrl },
        mimetype: "video/mp4",
        caption: `Prompt: ${input}\n\n*Powered by SAMKIEL BOT*`,
      },
      { quoted: message },
    );
  } catch (error) {
    console.error("[SORA] error:", error?.message || error);
    await sock.sendMessage(
      chatId,
      {
        text: "❌ Failed to generate video. Try a different prompt later.\n\n*Powered by SAMKIEL BOT*",
      },
      { quoted: message },
    );
  }
}

module.exports = soraCommand;
