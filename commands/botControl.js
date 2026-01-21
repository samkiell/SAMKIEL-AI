const { disableBot, enableBot, isBotDisabled } = require("../lib/botState");
const { isOwner, isSuperOwner } = require("../lib/isOwner");

async function handleBotControl(
  sock,
  chatId,
  senderId,
  command,
  message,
  channelInfo,
) {
  // Owner check is handled centrally in main.js
  if (command === "disablebot") {
    if (isBotDisabled(chatId)) {
      return await sock.sendMessage(
        chatId,
        {
          text: "❕ Bot is already disabled in this chat.",
          ...global.channelInfo,
        },
        { quoted: message },
      );
    }

    disableBot(chatId);
    return await sock.sendMessage(
      chatId,
      {
        text: "🚫 *Bot Disabled*\nI will no longer respond to commands in this chat until re-enabled by the owner.",
        ...global.channelInfo,
      },
      { quoted: message },
    );
  }

  if (command === "enablebot") {
    if (!isBotDisabled(chatId)) {
      return await sock.sendMessage(
        chatId,
        {
          text: "❕ Bot is already enabled in this chat.",
          ...global.channelInfo,
        },
        { quoted: message },
      );
    }

    enableBot(chatId);
    return await sock.sendMessage(
      chatId,
      {
        text: "✅ *Bot Enabled*\nI'm back! I will now respond to commands in this chat.",
        ...global.channelInfo,
      },
      { quoted: message },
    );
  }
}

module.exports = handleBotControl;
