const { jidNormalizedUser } = require("@whiskeysockets/baileys");

async function isAdmin(sock, chatId, senderId) {
  try {
    // Force refresh metadata to avoid stale cache issues (common in Baileys based bots)
    // Most implementations of groupMetadata in Baileys wrappers support a bypassCache flag
    const groupMetadata = await sock.groupMetadata(chatId).catch(async () => {
      return await sock.groupMetadata(chatId);
    });

    if (!groupMetadata || !groupMetadata.participants)
      return { isSenderAdmin: false, isBotAdmin: false };

    const participants = groupMetadata.participants;

    const normalizedSender = jidNormalizedUser(senderId).split("@")[0].split(":")[0].replace(/\D/g, "");
    const normalizedBot = jidNormalizedUser(sock.user?.id || "").split("@")[0].split(":")[0].replace(/\D/g, "");
    const botLid = sock.user?.lid ? jidNormalizedUser(sock.user.lid).split("@")[0].split(":")[0].replace(/\D/g, "") : null;

    const participant = participants.find((p) => {
      const pId = jidNormalizedUser(p.id).split("@")[0].split(":")[0].replace(/\D/g, "");
      return pId === normalizedSender;
    });

    const bot = participants.find((p) => {
      const pId = jidNormalizedUser(p.id).split("@")[0].split(":")[0].replace(/\D/g, "");
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
