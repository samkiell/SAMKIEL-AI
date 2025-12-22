const { disableBot, enableBot, isBotDisabled } = require("../lib/botState");
const { isOwner, isSuperOwner } = require("../lib/isOwner");

async function handleBotControl(
  sock,
  chatId,
  senderId,
  command,
  message,
  channelInfo
) {
  const isOwnerCheck = await isOwner(senderId);

  if (!isOwnerCheck) {
    return await sock.sendMessage(
      chatId,
      {
        text: "❌ Only the bot owner can use this command!",
      },
      { quoted: message }
    );
  }

  if (command === "disablebot") {
    if (isBotDisabled(chatId)) {
      return await sock.sendMessage(
        chatId,
        {
          text: "❕ Bot is already disabled in this chat.",
        },
        { quoted: message }
      );
    }

    disableBot(chatId);
    return await sock.sendMessage(
      chatId,
      {
        text: "🚫 *Bot Disabled*\nI will no longer respond to commands in this chat until re-enabled by the owner.",
      },
      { quoted: message }
    );
  }

  if (command === "enablebot") {
    if (!isBotDisabled(chatId)) {
      return await sock.sendMessage(
        chatId,
        {
          text: "❕ Bot is already enabled in this chat.",
        },
        { quoted: message }
      );
    }

    enableBot(chatId);
    return await sock.sendMessage(
      chatId,
      {
        text: "✅ *Bot Enabled*\nI'm back! I will now respond to commands in this chat.",
      },
      { quoted: message }
    );
  }
}

module.exports = handleBotControl;
