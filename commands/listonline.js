/**
 * List Online Command - Track active users
 */

const fs = require("fs");
const path = require("path");

const DATA_FILE = path.join(__dirname, "../data/online_activity.json");

// In-memory activity store
const userActivity = {};

function recordUserActivity(chatId, userId) {
  if (!userActivity[chatId]) userActivity[chatId] = {};
  userActivity[chatId][userId] = Date.now();
}

async function listOnlineCommand(sock, chatId, message) {
  const activity = userActivity[chatId] || {};
  const now = Date.now();
  const oneHour = 60 * 60 * 1000;

  const activeUsers = Object.entries(activity)
    .filter(([_, timestamp]) => now - timestamp < oneHour)
    .map(([userId]) => userId);

  if (activeUsers.length === 0) {
    return await sock.sendMessage(
      chatId,
      {
        text: "No recently active users found.",
      },
      { quoted: message },
    );
  }

  let text = `Active users (last hour):\n\n`;
  for (const user of activeUsers.slice(0, 20)) {
    text += `• @${user.split("@")[0]}\n`;
  }

  await sock.sendMessage(
    chatId,
    {
      text,
      mentions: activeUsers,
    },
    { quoted: message },
  );
}

module.exports = { listOnlineCommand, recordUserActivity };
