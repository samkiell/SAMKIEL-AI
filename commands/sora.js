const axios = require("axios");

const { loadPrefix } = require("../lib/prefix");
const { sendReaction } = require("../lib/reactions");

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
          text: `Provide a prompt. Example: ${p}sora anime girl with short blue hair\n\n> *Powered by SAMKIEL BOT*`,
        },
        { quoted: message },
      );
      return;
    }

    // Thinking... reaction
    await sendReaction(sock, message, "⏳");

    console.log(`[SORA] Generating video for prompt: "${input}"`);

    // Primary: Alakreb API (Active Vercel instance)
    const apiUrl = `https://alakreb.vercel.app/api/ai/generate-video?q=${encodeURIComponent(input)}`;

    const response = await axios.get(apiUrl, {
      timeout: 180000, // 3 minutes for video generation
      headers: {
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    const data = response.data;
    const videoUrl =
      data?.url ||
      data?.videoUrl ||
      data?.result ||
      data?.data?.videoUrl ||
      (typeof data === "string" && data.startsWith("http") ? data : null);

    if (!videoUrl) {
      console.error("[SORA] Invalid API Response:", data);
      throw new Error(
        "The AI service failed to return a video link. The prompt might be too complex or the service is overloaded.",
      );
    }

    console.log(`[SORA] Video generated successfully: ${videoUrl}`);

    await sock.sendMessage(
      chatId,
      {
        video: { url: videoUrl },
        mimetype: "video/mp4",
        caption: `🎬 *AI Video Generated*\n\n*Prompt:* ${input}\n\n> *Powered by SAMKIEL BOT*`,
      },
      { quoted: message },
    );
  } catch (error) {
    let errorMessage = "❌ *Video Generation Failed*";

    if (error.response) {
      console.error(
        `[SORA] API Error:`,
        error.response.status,
        error.response.data,
      );
      errorMessage += `\n\nThe server returned an error (${error.response.status}). It might be down.`;
    } else if (error.code === "ECONNABORTED") {
      console.error(`[SORA] Timeout Error: API took too long`);
      errorMessage += `\n\nRequest timed out. Creating videos takes time, and the server is currently slow.`;
    } else {
      console.error(`[SORA] Error:`, error.message);
      errorMessage += `\n\n${error.message}`;
    }

    await sendReaction(sock, message, "❌");
    await sock.sendMessage(chatId, { text: errorMessage }, { quoted: message });
  }
}

module.exports = soraCommand;
