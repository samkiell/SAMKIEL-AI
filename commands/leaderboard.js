const { getLeaderboard } = require("../lib/leveling");
const { channelInfo } = require("../lib/messageConfig");

async function leaderboardCommand(sock, chatId) {
  const topUsers = getLeaderboard(10);

  let text = `🏆 *Global Leaderboard* 🏆\n\n`;

  if (topUsers.length === 0) {
    text += "_No data yet. Start chatting!_";
  } else {
    topUsers.forEach((user, index) => {
      const medal =
        index === 0
          ? "🥇"
          : index === 1
          ? "🥈"
          : index === 2
          ? "🥉"
          : `${index + 1}.`;
      // Mask the number partially if it's a phone number (likely JIDs)
      const userId = user.userId.split("@")[0];
      text += `${medal} *${userId}*\n   └ 🔰 Lvl ${user.level} | ✨ ${user.xp} XP\n\n`;
    });
  }

  text += `_Chat more to climb the ranks!_`;

  await sock.sendMessage(chatId, {
    text: text,
    ...channelInfo,
  });
}

module.exports = leaderboardCommand;
