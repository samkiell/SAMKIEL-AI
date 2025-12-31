const { downloadMediaMessage } = require("@whiskeysockets/baileys");

async function saveStatusCommand(sock, chatId, message, args) {
  try {
    const quotedMessage =
      message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const remoteJid =
      message.message?.extendedTextMessage?.contextInfo?.remoteJid;

    if (remoteJid !== "status@broadcast" || !quotedMessage) {
      await sock.sendMessage(
        chatId,
        { text: "⚠️ Please reply to a status message with this command." },
        { quoted: message }
      );
      return;
    }

    const messageType = Object.keys(quotedMessage)[0];
    const supportedTypes = ["imageMessage", "videoMessage"];

    if (!supportedTypes.includes(messageType)) {
      await sock.sendMessage(
        chatId,
        { text: "⚠️ Only image and video statuses can be saved." },
        { quoted: message }
      );
      return;
    }

    // Download the media
    const buffer = await downloadMediaMessage(
      {
        message: quotedMessage,
        key: {
          remoteJid: "status@broadcast",
          id: message.message.extendedTextMessage.contextInfo.stanzaId,
        },
      },
      "buffer",
      {}
    );

    const caption = quotedMessage[messageType]?.caption || "";
    const mimetype =
      messageType === "imageMessage" ? "image/jpeg" : "video/mp4";

    // Determine destination
    const destination = args[0]?.toLowerCase() === "dm" ? chatId : chatId; // Default to chat where command is used. If in DM, it sends to DM.

    // If user wants to save to "dm" specifically and they are in a group, we might want to send to their private chat.
    // However, the request says "send it to the chat mor to persoanl dm".
    // Let's implement logic:
    // If sent in private DM: sends to that DM.
    // If sent in group: sends to group.
    // If specific arg "dm" is passed (e.g. .savestatus dm), sends to sender's DM even if in group.

    let targetJid = chatId;
    if (args[0]?.toLowerCase() === "dm") {
      targetJid = message.key.participant || message.key.remoteJid;
    }

    if (messageType === "imageMessage") {
      await sock.sendMessage(
        targetJid,
        { image: buffer, caption: caption },
        { quoted: message }
      );
    } else if (messageType === "videoMessage") {
      await sock.sendMessage(
        targetJid,
        { video: buffer, caption: caption, mimetype: "video/mp4" },
        { quoted: message }
      );
    }
  } catch (error) {
    console.error("Error in saveStatusCommand:", error);
    await sock.sendMessage(
      chatId,
      { text: "❌ Failed to savve status. Error: " + error.message },
      { quoted: message }
    );
  }
}

module.exports = saveStatusCommand;
