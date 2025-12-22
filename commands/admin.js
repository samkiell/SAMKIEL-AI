const fs = require("fs");
const path = require("path");
const os = require("os");
const { isOwner } = require("../lib/isOwner");
const settings = require("../settings");

async function panelCommand(sock, chatId, message) {
  const senderJid = message.key.participant || message.key.remoteJid;

  // Check if user is owner
  if (!(await isOwner(senderJid)) && !message.key.fromMe) {
    await sock.sendMessage(
      chatId,
      { text: "❌ Access denied. This command is for the bot owner only." },
      { quoted: message }
    );
    return;
  }

  try {
    await sock.sendMessage(chatId, { react: { text: "📊", key: message.key } });

    // Paths to data files
    const messageCountPath = path.join(__dirname, "../data/messageCount.json");
    const premiumPath = path.join(__dirname, "../data/premium.json");

    // Read data files
    let messageData = {};
    if (fs.existsSync(messageCountPath)) {
      messageData = JSON.parse(fs.readFileSync(messageCountPath, "utf8"));
    }

    let premiumData = { users: [] };
    if (fs.existsSync(premiumPath)) {
      premiumData = JSON.parse(fs.readFileSync(premiumPath, "utf8"));
    }

    // Calculate Stats
    let totalGroups = 0;
    let totalNewsletters = 0;
    let totalDMs = 0;
    let totalMessages = 0;
    let uniqueUsers = new Set();

    for (const [key, value] of Object.entries(messageData)) {
      if (key === "isPublic") continue;

      if (key.endsWith("@g.us")) {
        totalGroups++;
      } else if (key.endsWith("@newsletter")) {
        totalNewsletters++;
      } else if (key.endsWith("@s.whatsapp.net")) {
        totalDMs++;
        uniqueUsers.add(key); // Add DM user to unique users
      }

      if (typeof value === "object") {
        for (const [participant, count] of Object.entries(value)) {
          if (typeof count === "number") {
            // Add participant to unique users if it looks like a user JID
            if (
              participant.endsWith("@s.whatsapp.net") ||
              participant.endsWith("@lid")
            ) {
              uniqueUsers.add(participant);
            }
          }
        }
      }
    }

    const totalUsers = uniqueUsers.size;
    const totalPremium = premiumData.users.length;

    // System Stats
    const uptimeSeconds = process.uptime();
    const days = Math.floor(uptimeSeconds / (24 * 60 * 60));
    const hours = Math.floor((uptimeSeconds % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((uptimeSeconds % (60 * 60)) / 60);
    const seconds = Math.floor(uptimeSeconds % 60);

    const uptimeString = `${days}d ${hours}h ${minutes}m ${seconds}s`;

    const ramUsage = (process.memoryUsage().rss / 1024 / 1024).toFixed(2);
    const totalRam = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2);
    const cpuModel = os.cpus()[0].model;
    const platform = os.platform();
    const arch = os.arch();
    const nodeVersion = process.version;

    // Formatted Message
    const dashboard = `
*📊 SAMKIEL AI ADMIN PANEL*
━━━━━━━━━━━━━━━━━━━━
*👤 Owner:* ${settings.ownerName}
*🤖 Bot Name:* ${settings.botName}
*🏷️ Version:* v${settings.version}
━━━━━━━━━━━━━━━━━━━━
*📂 SYSTEM STATUS*
*⏱️ Uptime:* ${uptimeString}
*💻 RAM Usage:* ${ramUsage} MB / ${totalRam} GB
*🖥️ Platform:* ${platform} (${arch})
*⚙️ Node.js:* ${nodeVersion}
*🧠 CPU:* ${cpuModel}

*📈 BOT STATISTICS*
*👥 Total Users:* ${totalUsers}
*🏢 Total Groups:* ${totalGroups}
*📩 Total Messages:* ${totalMessages}
*💎 Premium Users:* ${totalPremium}
*💬 Active DMs:* ${totalDMs}
*📰 Newsletters:* ${totalNewsletters}
━━━━━━━━━━━━━━━━━━━━
`.trim();

    await sock.sendMessage(
      chatId,
      {
        text: dashboard,
        // optional: contextInfo for a nice card look if available
        contextInfo: {
          externalAdReply: {
            title: "System Dashboard",
            body: "Real-time Monitoring",
            thumbnailUrl: "https://i.imgur.com/3g7b4w0.jpeg", // Placeholder or bot logo
            sourceUrl: settings.website || "",
            mediaType: 1,
            renderLargerThumbnail: true,
          },
        },
      },
      { quoted: message }
    );
  } catch (error) {
    console.error("Error in panel command:", error);
    await sock.sendMessage(
      chatId,
      { text: "❌ Failed to retrieve system stats." },
      { quoted: message }
    );
  }
}

module.exports = panelCommand;
