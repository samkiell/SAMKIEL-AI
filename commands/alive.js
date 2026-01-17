const settings = require("../settings");
const { loadPrefix } = require("../lib/prefix");

async function aliveCommand(sock, chatId, message) {
  try {
    const currentPrefix = loadPrefix();
    const p = currentPrefix === "off" ? "" : currentPrefix;

    const aliveMessage =
      `*𝕊𝔸𝕄𝕂𝕀𝔼𝕃 𝔹𝕆𝕋 is Active!*\n\n` +
      `*Version:* ${settings.version || "2.1.0"}\n` +
      `*Status:* Online\n` +
      `*Mode:* Public\n\n` +
      `*🌟 Features:*\n` +
      `• Group Management\n` +
      `• Artificial Intelligence\n` +
      `• Fun Commands\n` +
      `• And more!\n\n` +
      `Type *${p}menu* for full command list`;

    const { sendText } = require("../lib/sendResponse");
    await sendText(sock, chatId, aliveMessage, { quoted: message });
  } catch (error) {
    console.error("Error in alive command:", error);
    const { sendText } = require("../lib/sendResponse");
    await sendText(sock, chatId, "Bot is alive and running!", {
      quoted: message,
    });
  }
}

module.exports = aliveCommand;
