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

    // Memory logic: RSS usage vs 300MB limit
    const usedMemory = process.memoryUsage().rss / 1024 / 1024;
    const totalMemoryLimit = 300;
    const ramStr = `${Math.round(usedMemory)}MB / ${totalMemoryLimit}MB`;

    // Directory size logic (Disk): Current folder vs 500MB limit
    let usedDisk = 0;
    try {
      const getDirSize = (dirPath) => {
        const files = fs.readdirSync(dirPath);
        let size = 0;
        for (const file of files) {
          const filePath = path.join(dirPath, file);
          const stats = fs.statSync(filePath);
          if (stats.isDirectory()) {
            size += getDirSize(filePath);
          } else {
            size += stats.size;
          }
        }
        return size;
      };
      usedDisk = getDirSize(process.cwd()) / 1024 / 1024;
    } catch (e) {}
    const totalDiskLimit = 500;
    const diskStr = `${Math.round(usedDisk)}MB / ${totalDiskLimit}MB`;

    const platform = os.platform();

    const finalMessage = `
┏━━〔 🤖 *${settings.botName || "𝕊𝔸𝕄𝕂𝕀𝔼𝕃 𝔹𝕆𝕋"}* 〕━━┓
┃
┃ 🚀 *Speed*    : ${ping} ms
┃ ⏱️ *Uptime*   : ${uptime}
┃ 🧠 *RAM*      : ${ramStr}
┃ 💾 *Disk*     : ${diskStr}
┃ 🖥️ *Platform* : ${platform}
┃ 🏷️ *Version*  : v${settings.version}
┃
┗━━━━━━━━━━━━━━━━━━━┛`.trim();

    // 4. Update with final stats
    await sock.sendMessage(chatId, {
      text: finalMessage,
      edit: key,
      ...global.channelInfo,
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
