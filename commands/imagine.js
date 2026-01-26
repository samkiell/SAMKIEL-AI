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
  const prefix = loadPrefix();
  const p = prefix === "off" ? "." : prefix;

  // Extract prompt correctly - skip the command word
  const parts = text.split(/\s+/);
  const prompt = parts.slice(1).join(" ").trim();

  if (!prompt) {
    return await sock.sendMessage(
      chatId,
      {
        text: `❌ *Missing Prompt*\n\nPlease provide a description of the image you want to generate.\n\nExample: *${p}imagine* a futuristic city with neon lights`,
      },
      { quoted: message },
    );
  }

  try {
    console.log(`[IMAGINE] Requesting image for: "${prompt}"`);
    await sendReaction(sock, message, "🎨");

    // Primary: Pollinations.ai (Reliable Flux source)
    const apiUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&nologo=true&seed=${Math.floor(Math.random() * 1000000)}`;

    const response = await axios.get(apiUrl, {
      timeout: 60000,
      responseType: "arraybuffer",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    if (response.status === 200 && response.data && response.data.length > 0) {
      await sendReaction(sock, message, "✅");
      await sock.sendMessage(
        chatId,
        {
          image: Buffer.from(response.data),
          caption: `✨ *Generated Image*\n\n*Prompt:* ${prompt}\n\n> *Powered by SAMKIEL BOT*`,
        },
        { quoted: message },
      );
    } else {
      throw new Error(`Invalid response (Status: ${response.status})`);
    }
  } catch (error) {
    let errorMessage = "❌ *Generation Failed*";

    if (error.response) {
      console.error(
        `[IMAGINE] API Error:`,
        error.response.status,
        error.response.data?.toString(),
      );
      errorMessage += `\n\nThe API returned an error (${error.response.status}). It might be down or rate-limited.`;
    } else if (error.request) {
      console.error(`[IMAGINE] Network Error: No response received`);
      errorMessage += `\n\nNetwork timeout. The AI server is taking too long to respond.`;
    } else {
      console.error(`[IMAGINE] Error:`, error.message);
      errorMessage += `\n\n${error.message}`;
    }

    await sendReaction(sock, message, "❌");
    await sock.sendMessage(chatId, { text: errorMessage }, { quoted: message });
  }
}

module.exports = imagineCommand;
