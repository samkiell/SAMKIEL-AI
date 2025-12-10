const { getUserRank } = require("../lib/leveling");
const { channelInfo } = require("../lib/messageConfig");

async function rankCommand(sock, chatId, message) {
  let targetId = message.key.participant || message.key.remoteJid;

  // Check if user mentioned someone
  if (
    message.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0
  ) {
    targetId = message.message.extendedTextMessage.contextInfo.mentionedJid[0];
  }
  // Check for reply
  else if (message.message?.extendedTextMessage?.contextInfo?.participant) {
    targetId = message.message.extendedTextMessage.contextInfo.participant;
  }

  const { level, xp, rank, xpNeeded } = getUserRank(targetId);

  let profilePic;
  try {
    profilePic = await sock.profilePictureUrl(targetId, "image");
  } catch {
    profilePic = "https://i.imgur.com/2wzGhpF.jpeg";
  }

  const username = targetId.split("@")[0];

  const rankMsg =
    `🏆 *User Rank Profile* 🏆\n\n` +
    `👤 *User:* @${username}\n` +
    `📊 *Rank:* #${rank}\n` +
    `🔰 *Level:* ${level}\n` +
    `✨ *XP:* ${xp}\n` +
    `📈 *Next Level:* ${xpNeeded} XP needed\n\n` +
    `_Keep chatting to earn more XP!_`;

  await sock.sendMessage(chatId, {
    image: { url: profilePic },
    caption: rankMsg,
    mentions: [targetId],
    ...channelInfo,
  });
}

module.exports = rankCommand;
