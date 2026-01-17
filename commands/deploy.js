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

    const { sendText } = require("../lib/sendResponse");
    await sendText(sock, chatId, deployMessage, {
      withBranding: true,
      quoted: message,
    });
  } catch (error) {
    console.error("Error in deploy command:", error);
    const { sendText } = require("../lib/sendResponse");
    await sendText(sock, chatId, "❌ Failed to send deployment info.", {
      quoted: message,
    });
  }
}

module.exports = deployCommand;
