const { setRankEnabled } = require("../lib/rankConfig");
const { channelInfo } = require("../lib/messageConfig");

async function rankToggleCommand(
  sock,
  chatId,
  isGroup,
  command,
  isSenderAdmin,
  isOwner
) {
  if (!isGroup) {
    await sock.sendMessage(chatId, {
      text: "⚠️ This command can only be used in groups.",
      ...channelInfo,
    });
    return;
  }

  // Check permissions
  if (!isSenderAdmin && !isOwner) {
    await sock.sendMessage(chatId, {
      text: "⚠️ Only group admins or the bot owner can toggle ranking.",
      ...channelInfo,
    });
    return;
  }

  if (command === "rankon") {
    setRankEnabled(chatId, true);
    await sock.sendMessage(chatId, {
      text: "✅ *Ranking Enabled*\nLevel-up messages will now appear in this group.",
      ...channelInfo,
    });
  } else if (command === "rankoff") {
    setRankEnabled(chatId, false);
    await sock.sendMessage(chatId, {
      text: "❌ *Ranking Disabled*\nXP gain and Level-up messages are now disabled for this group.",
      ...channelInfo,
    });
  }
}

module.exports = rankToggleCommand;
