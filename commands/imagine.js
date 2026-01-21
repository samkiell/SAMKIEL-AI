/**
 * Imagine Command - AI Image Generation
 */

const axios = require("axios");
const { loadPrefix } = require("../lib/prefix");
const { sendReaction } = require("../lib/reactions");

async function imagineCommand(sock, chatId, message) {
  console.log(`[IMAGINE] Command triggered`);

  const text =
    message.message?.conversation ||
    message.message?.extendedTextMessage?.text ||
    "";

  const p = loadPrefix() === "off" ? "" : loadPrefix();
  const parts = text.split(/\s+/);
  const prompt = parts.slice(1).join(" ").trim();

  if (!prompt) {
    return await sock.sendMessage(
      chatId,
      {
        text: `Please provide a prompt.\n\nUsage: ${p}imagine a cat in space`,
      },
      { quoted: message },
    );
  }

  try {
    await sendReaction(sock, message, "🎨");

    // Try Kord API
    const response = await axios.get(
      `https://api.kord.live/flux?prompt=${encodeURIComponent(prompt)}`,
      { timeout: 60000, responseType: "arraybuffer" },
    );

    if (response.data) {
      await sendReaction(sock, message, "✅");
      await sock.sendMessage(
        chatId,
        {
          image: Buffer.from(response.data),
          caption: `Prompt: ${prompt}`,
        },
        { quoted: message },
      );
    } else {
      throw new Error("No image data");
    }
  } catch (error) {
    console.log(`[IMAGINE] Error: ${error.message}`);
    await sendReaction(sock, message, "❌");
    await sock.sendMessage(
      chatId,
      {
        text: "Failed to generate image. Try again.",
      },
      { quoted: message },
    );
  }
}

module.exports = imagineCommand;
