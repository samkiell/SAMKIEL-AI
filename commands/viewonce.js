const {
  downloadContentFromMessage,
  jidNormalizedUser,
} = require("@whiskeysockets/baileys");
const settings = require("../settings");
const fs = require("fs");
const path = require("path");

async function viewOnceCommand(sock, chatId, message, isDm = false) {
  try {
    // Get quoted message
    const quotedMessage =
      message.message?.extendedTextMessage?.contextInfo?.quotedMessage ||
      message.message?.imageMessage ||
      message.message?.videoMessage;

    if (!quotedMessage) {
      await sock.sendMessage(chatId, {
        text: "❌ Please reply to a view once message!",
      });
      return;
    }

    // Unwrap ephemeral message
    let msgContent = quotedMessage;
    if (msgContent.ephemeralMessage) {
      msgContent = msgContent.ephemeralMessage.message;
    }

    let mediaMessage;
    let isViewOnceImage = false;
    let isViewOnceVideo = false;

    // Detection logic
    if (msgContent.viewOnceMessageV2) {
      const content = msgContent.viewOnceMessageV2.message;
      if (content?.imageMessage) {
        isViewOnceImage = true;
        mediaMessage = content.imageMessage;
      } else if (content?.videoMessage) {
        isViewOnceVideo = true;
        mediaMessage = content.videoMessage;
      }
    } else if (msgContent.viewOnceMessageV2Extension) {
      const content = msgContent.viewOnceMessageV2Extension.message;
      if (content?.imageMessage) {
        isViewOnceImage = true;
        mediaMessage = content.imageMessage;
      } else if (content?.videoMessage) {
        isViewOnceVideo = true;
        mediaMessage = content.videoMessage;
      }
    } else if (msgContent.viewOnceMessage) {
      const content = msgContent.viewOnceMessage.message;
      if (content?.imageMessage) {
        isViewOnceImage = true;
        mediaMessage = content.imageMessage;
      } else if (content?.videoMessage) {
        isViewOnceVideo = true;
        mediaMessage = content.videoMessage;
      }
    } else {
      if (msgContent.imageMessage && msgContent.imageMessage.viewOnce) {
        isViewOnceImage = true;
        mediaMessage = msgContent.imageMessage;
      } else if (msgContent.videoMessage && msgContent.videoMessage.viewOnce) {
        isViewOnceVideo = true;
        mediaMessage = msgContent.videoMessage;
      }
    }

    if (!mediaMessage) {
      await sock.sendMessage(chatId, {
        text: "❌ Could not detect view once message! Please make sure you replied to a view once image/video.",
      });
      return;
    }

    // Determine target JID
    let targetJid = chatId;
    if (isDm) {
      // Send to Bot's DM (Note to self)
      // sock.user.id format is usually "123456789:0@s.whatsapp.net"
      targetJid = jidNormalizedUser(sock.user.id);
    }

    const caption = mediaMessage.caption || "";
    const cleanCaption = caption ? `*Caption:* ${caption}` : "";
    const mediaTypeCaption = isViewOnceImage ? "Image 📸" : "Video 📹";
    const finalCaption = cleanCaption;

    // Process Image
    if (isViewOnceImage) {
      try {
        const stream = await downloadContentFromMessage(mediaMessage, "image");
        let buffer = Buffer.from([]);
        for await (const chunk of stream) {
          buffer = Buffer.concat([buffer, chunk]);
        }

        await sock.sendMessage(targetJid, {
          image: buffer,
          caption: finalCaption,
        });
      } catch (err) {
        console.error("❌ Error downloading image:", err);
        await sock.sendMessage(chatId, {
          text: "❌ Failed to process view once image!",
        });
        return;
      }
    }

    // Process Video
    if (isViewOnceVideo) {
      try {
        // Create temp directory if it doesn't exist
        const tempDir = path.join(__dirname, "../temp");
        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir);
        }

        const tempFile = path.join(tempDir, `temp_${Date.now()}.mp4`);
        const stream = await downloadContentFromMessage(mediaMessage, "video");
        const writeStream = fs.createWriteStream(tempFile);

        for await (const chunk of stream) {
          writeStream.write(chunk);
        }
        writeStream.end();

        // Wait for file to be written
        await new Promise((resolve) => writeStream.on("finish", resolve));

        await sock.sendMessage(targetJid, {
          video: fs.readFileSync(tempFile),
          caption: finalCaption,
        });

        // Clean up temp file
        fs.unlinkSync(tempFile);
      } catch (err) {
        console.error("❌ Error processing video:", err);
        await sock.sendMessage(chatId, {
          text: "❌ Failed to process view once video!",
        });
        return;
      }
    }

    // Acknowledge if sent to DM
    if (isDm) {
      await sock.sendMessage(
        chatId,
        { text: "✅ Media sent to bot DM" },
        { quoted: message }
      );
    }
  } catch (error) {
    console.error("❌ Error in viewonce command:", error);
    await sock.sendMessage(chatId, {
      text: "❌ Error processing view once message!",
    });
  }
}

module.exports = viewOnceCommand;
