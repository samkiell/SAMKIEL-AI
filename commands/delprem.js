const { removePremium } = require("../lib/premium");
const { isOwner } = require("../lib/isOwner");
const { loadPrefix } = require("../lib/prefix");

async function delPremCommand(sock, chatId, senderId, message) {
  const isOwnerCheck = await isOwner(senderId);
  if (!isOwnerCheck) {
    await sock.sendMessage(chatId, {
      text: "❌ Only the bot owner can remove premium users.",
    });
    return;
  }

  let userToRem;

  // Check for mentioned users
  const mentionedJid =
    message.message?.extendedTextMessage?.contextInfo?.mentionedJid;
  if (mentionedJid && mentionedJid.length > 0) {
    userToRem = mentionedJid[0];
  }
  // Check for replied message
  else if (message.message?.extendedTextMessage?.contextInfo?.participant) {
    userToRem = message.message.extendedTextMessage.contextInfo.participant;
  }
  // Check for text argument (number)
  else {
    const text =
      message.message?.conversation ||
      message.message?.extendedTextMessage?.text;
    const args = text.split(" ");
    if (args.length > 1) {
      let number = args[1].replace(/[^0-9]/g, "");
      if (number) {
        userToRem = number + "@s.whatsapp.net";
      }
    }
  }

  if (!userToRem) {
    const currentPrefix = loadPrefix();
    const p = currentPrefix === "off" ? "" : currentPrefix;
    await sock.sendMessage(chatId, {
      text: `Please mention a user, reply to a user, or provide a number to remove from premium.\nExample: ${p}delprem @user`,
    });
    return;
  }

  // Remove from premium
  removePremium(userToRem);

  await sock.sendMessage(chatId, {
    text: `✅ User @${userToRem.split("@")[0]} has been removed from Premium!`,
    mentions: [userToRem],
  });
}

module.exports = delPremCommand;
