const { setRankEnabled, setGlobalRankEnabled } = require("../lib/rankConfig");
const { channelInfo } = require("../lib/messageConfig");

async function rankToggleCommand(
  sock,
  chatId,
  isGroup,
  command,
  isSenderAdmin,
  isOwner
) {
  // If Owner runs the command, applies globally
  if (isOwner) {
    if (command === "rankon") {
      setGlobalRankEnabled(true);
      await sock.sendMessage(chatId, {
        text: "✅ *Global Ranking Enabled*\nLevel-up messages and XP gain are now enabled for all groups (unless individually disabled).",
        ...channelInfo,
      });
    } else if (command === "rankoff") {
      setGlobalRankEnabled(false);
      await sock.sendMessage(chatId, {
        text: "❌ *Global Ranking Disabled*\nLevel-up messages and XP gain are now disabled for ALL groups.",
        ...channelInfo,
      });
    }
    return;
  }

  // Group Admin Helper (Local Scope)
  if (!isGroup) {
    await sock.sendMessage(chatId, {
      text: "⚠️ This command can only be used in groups.",
      ...channelInfo,
    });
    return;
  }

  if (!isSenderAdmin) {
    await sock.sendMessage(chatId, {
      text: "⚠️ Only group admins or the bot owner can toggle ranking.",
      ...channelInfo,
    });
    return;
  }

  if (command === "rankon") {
    setRankEnabled(chatId, true);
    await sock.sendMessage(chatId, {
      text: "✅ *Ranking Enabled*\nLevel-up messages will now appear in this group (if enabled globally).",
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
