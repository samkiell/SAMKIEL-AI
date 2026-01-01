const { addPremium } = require("../lib/premium");
const { isOwner } = require("../lib/isOwner");
const { loadPrefix } = require("../lib/prefix");

async function addPremCommand(sock, chatId, senderId, message) {
  const isOwnerCheck = await isOwner(senderId);
  if (!isOwnerCheck) {
    await sock.sendMessage(chatId, {
      text: "❌ Only the bot owner can add premium users.",
      ...global.channelInfo,
    });
    return;
  }

  let userToAdd;

  // Check for mentioned users
  const mentionedJid =
    message.message?.extendedTextMessage?.contextInfo?.mentionedJid;
  if (mentionedJid && mentionedJid.length > 0) {
    userToAdd = mentionedJid[0];
  }
  // Check for replied message
  else if (message.message?.extendedTextMessage?.contextInfo?.participant) {
    userToAdd = message.message.extendedTextMessage.contextInfo.participant;
  }
  // Check for text argument (number)
  else {
    const text =
      message.message?.conversation ||
      message.message?.extendedTextMessage?.text;
    const args = text.split(" ");
    if (args.length > 1) {
      // Remove symbols and add domain
      let number = args[1].replace(/[^0-9]/g, "");
      if (number) {
        userToAdd = number + "@s.whatsapp.net";
      }
    }
  }

  if (!userToAdd) {
    const currentPrefix = loadPrefix();
    const p = currentPrefix === "off" ? "" : currentPrefix;
    await sock.sendMessage(chatId, {
      text: `Please mention a user, reply to a user, or provide a number to add to premium.\nExample: ${p}addprem @user or ${p}addprem 1234567890`,
      ...global.channelInfo,
    });
    return;
  }

  // Add to premium
  // We can pass a name/number if we want, but logic mainly uses JID
  addPremium(userToAdd, userToAdd.split("@")[0]);

  await sock.sendMessage(chatId, {
    text: `✅ User @${userToAdd.split("@")[0]} has been added to Premium!`,
    mentions: [userToAdd],
    ...global.channelInfo,
  });
}

module.exports = addPremCommand;
