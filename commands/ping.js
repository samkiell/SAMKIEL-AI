const os = require("os");
const settings = require("../settings.js");
const { performance } = require("perf_hooks");

function formatTime(seconds) {
  const days = Math.floor(seconds / (24 * 60 * 60));
  seconds = seconds % (24 * 60 * 60);
  const hours = Math.floor(seconds / (60 * 60));
  seconds = seconds % (60 * 60);
  const minutes = Math.floor(seconds / 60);
  seconds = Math.floor(seconds % 60);

  let time = "";
  if (days > 0) time += `${days}d `;
  if (hours > 0) time += `${hours}h `;
  if (minutes > 0) time += `${minutes}m `;
  if (seconds > 0 || time === "") time += `${seconds}s`;

  return time.trim();
}

function formatBytes(bytes) {
  if (bytes === 0) return "0 B";
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
}

async function pingCommand(sock, chatId, message) {
  try {
    const start = performance.now();

    // 1. Send initial message and get the key to edit it
    const initialMsg = await sock.sendMessage(
      chatId,
      { text: "⚡ Pinging..." },
      { quoted: message }
    );
    const key = initialMsg.key;

    // 2. Loading animation
    const loaders = [
      "⬜⬜⬜⬜⬜ 0%",
      "🟩⬜⬜⬜⬜ 20%",
      "🟩🟩⬜⬜⬜ 40%",
      "🟩🟩🟩⬜⬜ 60%",
      "🟩🟩🟩🟩⬜ 80%",
      "🟩🟩🟩🟩🟩 100%",
    ];

    for (const loader of loaders) {
      await new Promise((r) => setTimeout(r, 200)); // Small delay for animation
      await sock.sendMessage(chatId, {
        text: `⚡ Pinging...\n${loader}`,
        edit: key,
      });
    }

    // 3. Calculate final stats
    const end = performance.now();
    const ping = (end - start).toFixed(2);
    const uptime = formatTime(process.uptime());
    const ramUsage = formatBytes(process.memoryUsage().rss);
    const totalMem = formatBytes(os.totalmem());
    const platform = os.platform();

    const finalMessage = `
┏━━〔 🤖 *𝕊𝔸𝕄𝕂𝕀𝔼𝕃 𝔹𝕆𝕋* 〕━━┓
┃
┃ 🚀 *Speed*    : ${ping} ms
┃ ⏱️ *Uptime*   : ${uptime}
┃ 💻 *RAM*      : ${ramUsage} / ${totalMem}
┃ 🖥️ *Platform* : ${platform}
┃ 🏷️ *Version*  : v${settings.version}
┃
┗━━━━━━━━━━━━━━━━━━━┛`.trim();

    // 4. Update with final stats
    await sock.sendMessage(chatId, {
      text: finalMessage,
      edit: key,
      contextInfo: {
        forwardingScore: 1,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
          newsletterJid: "120363400862271383@newsletter",
          newsletterName: "𝕊𝔸𝕄𝕂𝕀𝔼𝕃 𝔹𝕆𝕋",
          serverMessageId: -1,
        },
      },
    });
  } catch (error) {
    console.error("Error in ping command:", error);
    await sock.sendMessage(
      chatId,
      { text: "❌ Failed to calculate ping." },
      { quoted: message }
    );
  }
}

module.exports = pingCommand;
