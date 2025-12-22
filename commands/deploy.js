const settings = require("../settings");
const { loadPrefix } = require("../lib/prefix");

async function deployCommand(sock, chatId, message) {
  try {
    const currentPrefix = loadPrefix();
    const p = currentPrefix === "off" ? "" : currentPrefix;

    const deployMessage = `
┏━━〔 🚀 *SAMKIEL BOT DEPLOYMENT* 〕━━┓
┃
┃ 🛠️ *How to Deploy:*
┃ 1. Visit the link below.
┃ 2. Sign up or log in.
┃ 3. Follow the instructions to scan QR code
┃    or use pairing code.
┃ 4. The bot will automatically deploy.
┃
┃ 🌐 *Deploy Link:*
┃ ${settings.website}/deploy
┃
┃ 🆘 *Need Support?*
┃ Use ${p}owner to contact support.
┃
┗━━━━━━━━━━━━━━━━━━━┛`.trim();

    await sock.sendMessage(
      chatId,
      {
        text: deployMessage,
        contextInfo: {
          forwardingScore: 1,
          isForwarded: true,
          forwardedNewsletterMessageInfo: {
            newsletterJid: "120363400862271383@newsletter",
            newsletterName: "𝕊𝔸𝕄𝕂𝕀𝔼𝕃 𝔹𝕆𝕋",
            serverMessageId: -1,
          },
        },
      },
      { quoted: message }
    );
  } catch (error) {
    console.error("Error in deploy command:", error);
    await sock.sendMessage(
      chatId,
      { text: "❌ Failed to send deployment info." },
      { quoted: message }
    );
  }
}

module.exports = deployCommand;
