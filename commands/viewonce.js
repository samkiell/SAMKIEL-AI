const { downloadContentFromMessage } = require("@whiskeysockets/baileys");
const settings = require("../settings");
const fs = require("fs");
const path = require("path");

// Channel info for message context
const channelInfo = {
  contextInfo: {
    forwardingScore: 1,
    isForwarded: true,
    forwardedNewsletterMessageInfo: {
      newsletterJid: "120363400862271383@newsletter",
      newsletterName: "𝕊𝔸𝕄𝕂𝕀𝔼𝕃 𝔹𝕆𝕋",
      serverMessageId: -1,
    },
  },
};

async function viewOnceCommand(sock, chatId, message) {
  try {
    // Get quoted message with better error handling
    const quotedMessage =
      message.message?.extendedTextMessage?.contextInfo?.quotedMessage ||
      message.message?.imageMessage ||
      message.message?.videoMessage;

    if (!quotedMessage) {
      await sock.sendMessage(chatId, {
        text: "❌ Please reply to a view once message!",
        ...channelInfo,
      });
      return;
    }

    // Enhanced view once detection
    // Check for ViewOnce in quoted message
    if (quotedMessage.viewOnceMessageV2) {
      if (quotedMessage.viewOnceMessageV2.message.imageMessage) {
        isViewOnceImage = true;
        mediaMessage = quotedMessage.viewOnceMessageV2.message.imageMessage;
      } else if (quotedMessage.viewOnceMessageV2.message.videoMessage) {
        isViewOnceVideo = true;
        mediaMessage = quotedMessage.viewOnceMessageV2.message.videoMessage;
      }
    } else if (quotedMessage.viewOnceMessageV2Extension) {
      if (quotedMessage.viewOnceMessageV2Extension.message.imageMessage) {
        isViewOnceImage = true;
        mediaMessage =
          quotedMessage.viewOnceMessageV2Extension.message.imageMessage;
      } else if (
        quotedMessage.viewOnceMessageV2Extension.message.videoMessage
      ) {
        isViewOnceVideo = true;
        mediaMessage =
          quotedMessage.viewOnceMessageV2Extension.message.videoMessage;
      }
    } else if (quotedMessage.viewOnceMessage) {
      if (quotedMessage.viewOnceMessage.message.imageMessage) {
        isViewOnceImage = true;
        mediaMessage = quotedMessage.viewOnceMessage.message.imageMessage;
      } else if (quotedMessage.viewOnceMessage.message.videoMessage) {
        isViewOnceVideo = true;
        mediaMessage = quotedMessage.viewOnceMessage.message.videoMessage;
      }
    } else {
      // Direct ViewOnce check
      if (quotedMessage.imageMessage && quotedMessage.imageMessage.viewOnce) {
        isViewOnceImage = true;
        mediaMessage = quotedMessage.imageMessage;
      } else if (
        quotedMessage.videoMessage &&
        quotedMessage.videoMessage.viewOnce
      ) {
        isViewOnceVideo = true;
        mediaMessage = quotedMessage.videoMessage;
      }
    }

    // Get the actual message content
    // Initialize flags if not already set by the block above
    if (typeof isViewOnceImage === "undefined") isViewOnceImage = false;
    if (typeof isViewOnceVideo === "undefined") isViewOnceVideo = false;

    if (!mediaMessage) {
      console.log("Message structure:", JSON.stringify(message, null, 2));
      await sock.sendMessage(chatId, {
        text: "❌ Could not detect view once message! Please make sure you replied to a view once image/video.",
        ...channelInfo,
      });
      return;
    }

    // Handle view once image
    if (isViewOnceImage) {
      try {
        console.log("📸 Processing view once image...");
        const stream = await downloadContentFromMessage(mediaMessage, "image");
        let buffer = Buffer.from([]);
        for await (const chunk of stream) {
          buffer = Buffer.concat([buffer, chunk]);
        }

        const caption = mediaMessage.caption || "";

        await sock.sendMessage(chatId, {
          image: buffer,
          caption: `* Nothing is hidden*\n\n*Type:* Image 📸\n${
            caption ? `*Caption:* ${caption}` : ""
          }`,
          ...channelInfo,
        });
        console.log("✅ View once image processed successfully");
        return;
      } catch (err) {
        console.error("❌ Error downloading image:", err);
        await sock.sendMessage(chatId, {
          text: "❌ Failed to process view once image! Error: " + err.message,
          ...channelInfo,
        });
        return;
      }
    }

    // Handle view once video
    if (isViewOnceVideo) {
      try {
        console.log("📹 Processing view once video...");

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

        const caption = mediaMessage.caption || "";

        await sock.sendMessage(chatId, {
          video: fs.readFileSync(tempFile),
          caption: `*💀 𝕊𝔸𝕄𝕂𝕀𝔼𝕃 𝔹𝕆𝕋 Anti ViewOnce 💀*\n\n*Type:* Video 📹\n${
            caption ? `*Caption:* ${caption}` : ""
          }`,
          ...channelInfo,
        });

        // Clean up temp file
        fs.unlinkSync(tempFile);

        console.log("✅ View once video processed successfully");
        return;
      } catch (err) {
        console.error("❌ Error processing video:", err);
        await sock.sendMessage(chatId, {
          text: "❌ Failed to process view once video! Error: " + err.message,
          ...channelInfo,
        });
        return;
      }
    }

    // If we get here, it wasn't a view once message
    await sock.sendMessage(chatId, {
      text: "❌ This is not a view once message! Please reply to a view once image/video.",
      ...channelInfo,
    });
  } catch (error) {
    console.error("❌ Error in viewonce command:", error);
    await sock.sendMessage(chatId, {
      text: "❌ Error processing view once message! Error: " + error.message,
      ...channelInfo,
    });
  }
}

module.exports = viewOnceCommand;
