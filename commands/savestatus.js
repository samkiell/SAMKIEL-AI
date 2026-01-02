const { downloadMediaMessage } = require("@whiskeysockets/baileys");
const fs = require("fs");
const path = require("path");

async function saveStatusCommand(sock, chatId, message, args) {
  let filePath = null;
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
    const ext = messageType === "imageMessage" ? "jpg" : "mp4";
    const fileName = `temp_save_${Date.now()}.${ext}`;
    const downloadDir = path.join(__dirname, "../data/status_downloads");

    // Ensure directory exists
    if (!fs.existsSync(downloadDir)) {
      fs.mkdirSync(downloadDir, { recursive: true });
    }

    filePath = path.join(downloadDir, fileName);

    // 1. Save it to disk (per user request)
    fs.writeFileSync(filePath, buffer);
    console.log(`💾 Temporary status saved to: ${filePath}`);

    let targetJid = chatId;
    if (args[0]?.toLowerCase() === "dm") {
      targetJid = message.key.participant || message.key.remoteJid;
    }

    // 2. Send it from disk/buffer
    if (messageType === "imageMessage") {
      await sock.sendMessage(
        targetJid,
        { image: fs.readFileSync(filePath), caption: caption },
        { quoted: message }
      );
    } else if (messageType === "videoMessage") {
      await sock.sendMessage(
        targetJid,
        {
          video: fs.readFileSync(filePath),
          caption: caption,
          mimetype: "video/mp4",
        },
        { quoted: message }
      );
    }

    console.log(`✅ Status sent to ${targetJid}`);
  } catch (error) {
    console.error("Error in saveStatusCommand:", error);
    await sock.sendMessage(
      chatId,
      { text: "❌ Failed to save status. Error: " + error.message },
      { quoted: message }
    );
  } finally {
    // 3. Delete it immediately (per user request)
    if (filePath && fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
        console.log(`🧹 Deleted temporary status file: ${filePath}`);
      } catch (e) {
        console.error("🧹 Failed to delete temporary file:", e);
      }
    }
  }
}

module.exports = saveStatusCommand;
