const { jidNormalizedUser } = require("@whiskeysockets/baileys");

async function isAdmin(sock, chatId, senderId) {
  try {
    const groupMetadata = await sock.groupMetadata(chatId);
    const participants = groupMetadata.participants;

    const normalizedSender = jidNormalizedUser(senderId);
    const normalizedBot = jidNormalizedUser(sock.user?.id || "");
    const botLid = sock.user?.lid ? jidNormalizedUser(sock.user.lid) : null;

    const participant = participants.find(
      (p) => jidNormalizedUser(p.id) === normalizedSender
    );

    const bot = participants.find((p) => {
      const pId = jidNormalizedUser(p.id);
      return pId === normalizedBot || (botLid && pId === botLid);
    });

    const isSenderAdmin =
      participant &&
      (participant.admin === "admin" || participant.admin === "superadmin");
    const isBotAdmin =
      bot && (bot.admin === "admin" || bot.admin === "superadmin");

    return { isSenderAdmin: !!isSenderAdmin, isBotAdmin: !!isBotAdmin };
  } catch (error) {
    console.error("Error in isAdmin:", error);
    return { isSenderAdmin: false, isBotAdmin: false };
  }
}

module.exports = isAdmin;
