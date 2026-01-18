/**
 * List Online Command - Track and display active users in groups
 */

const fs = require("fs");
const path = require("path");

const DATA_FILE = path.join(__dirname, "../data/online_activity.json");

// In-memory activity store (persisted on changes)
let userActivity = {};

// Load persisted data on startup
try {
  if (fs.existsSync(DATA_FILE)) {
    userActivity = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  }
} catch (e) {}

function saveActivity() {
  try {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(userActivity, null, 2));
  } catch (e) {}
}

function recordUserActivity(chatId, userId) {
  if (!chatId || !userId) return;
  if (!userActivity[chatId]) userActivity[chatId] = {};
  userActivity[chatId][userId] = Date.now();
  // Save periodically (every 10 records)
  if (Math.random() < 0.1) saveActivity();
}

async function listOnlineCommand(sock, chatId, message) {
  const isGroup = chatId.endsWith("@g.us");

  if (!isGroup) {
    return await sock.sendMessage(
      chatId,
      {
        text: "This command only works in groups.",
      },
      { quoted: message },
    );
  }

  try {
    await sock.sendMessage(chatId, { react: { text: "👥", key: message.key } });

    const activity = userActivity[chatId] || {};
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;

    // Get users active in last hour, sorted by most recent
    const activeUsers = Object.entries(activity)
      .filter(([_, timestamp]) => now - timestamp < oneHour)
      .sort(([, a], [, b]) => b - a)
      .map(([userId, timestamp]) => ({
        userId,
        minsAgo: Math.round((now - timestamp) / 60000),
      }));

    if (activeUsers.length === 0) {
      return await sock.sendMessage(
        chatId,
        {
          text: "📭 No recently active users found in the last hour.\n\nUsers will appear here after they send messages.",
        },
        { quoted: message },
      );
    }

    let text = `👥 *Active Users (Last Hour)*\n\n`;
    const mentions = [];

    for (const { userId, minsAgo } of activeUsers.slice(0, 30)) {
      const number = userId.split("@")[0];
      const timeStr = minsAgo === 0 ? "just now" : `${minsAgo}m ago`;
      text += `• @${number} - ${timeStr}\n`;
      mentions.push(userId);
    }

    text += `\n📊 Total: ${activeUsers.length} active user${activeUsers.length > 1 ? "s" : ""}`;

    await sock.sendMessage(chatId, { react: { text: "✅", key: message.key } });
    await sock.sendMessage(chatId, { text, mentions }, { quoted: message });
  } catch (error) {
    await sock.sendMessage(
      chatId,
      {
        text: `Error: ${error.message}`,
      },
      { quoted: message },
    );
  }
}

module.exports = { listOnlineCommand, recordUserActivity };
