const isAdmin = require("../lib/isAdmin");

async function deleteCommand(sock, chatId, message, senderId) {
  const { isSenderAdmin, isBotAdmin } = await isAdmin(sock, chatId, senderId);

  if (!isBotAdmin) {
    await sock.sendMessage(chatId, {
      text: "I need to be an admin to delete messages.",
      ...global.channelInfo,
    });
    return;
  }

  if (!isSenderAdmin) {
    await sock.sendMessage(chatId, {
      text: "Only admins can use the .delete command.",
      ...global.channelInfo,
    });
    return;
  }

  const quotedMessage =
    message.message?.extendedTextMessage?.contextInfo?.stanzaId;
  const quotedParticipant =
    message.message?.extendedTextMessage?.contextInfo?.participant;

  if (quotedMessage) {
    // Delete the quoted message
    await sock.sendMessage(chatId, {
      delete: {
        remoteJid: chatId,
        fromMe: false,
        id: quotedMessage,
        participant: quotedParticipant,
      },
    });

    // Delete the command message itself
    if (message.key) {
      await sock.sendMessage(chatId, { delete: message.key });
    }
  } else {
    await sock.sendMessage(chatId, {
      text: "Please reply to a message you want to delete.",
      ...global.channelInfo,
    });
  }
}

module.exports = deleteCommand;
