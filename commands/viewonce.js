const { downloadContentFromMessage } = require("@whiskeysockets/baileys");
const settings = require("../settings");
const fs = require("fs");
const path = require("path");

// Channel info for message context

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
        ...global.channelInfo,
      });
      return;
    }

    // Unwrap ephemeral message if present
    let msgContent = quotedMessage;
    if (msgContent.ephemeralMessage) {
      msgContent = msgContent.ephemeralMessage.message;
    }

    // Enhanced view once detection
    // Check for ViewOnce in quoted message
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
      // Direct ViewOnce check
      if (msgContent.imageMessage && msgContent.imageMessage.viewOnce) {
        isViewOnceImage = true;
        mediaMessage = msgContent.imageMessage;
      } else if (msgContent.videoMessage && msgContent.videoMessage.viewOnce) {
        isViewOnceVideo = true;
        mediaMessage = msgContent.videoMessage;
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
        ...global.channelInfo,
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
          caption: `* *Nothing is hidden*\n\n*Type:* Image 📸\n${
            caption ? `*Caption:* ${caption}` : ""
          }`,
          ...global.channelInfo,
        });
        console.log("✅ View once image processed successfully");
        return;
      } catch (err) {
        console.error("❌ Error downloading image:", err);
        await sock.sendMessage(chatId, {
          text: "❌ Failed to process view once image! Error: " + err.message,
          ...global.channelInfo,
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
          ...global.channelInfo,
        });

        // Clean up temp file
        fs.unlinkSync(tempFile);

        console.log("✅ View once video processed successfully");
        return;
      } catch (err) {
        console.error("❌ Error processing video:", err);
        await sock.sendMessage(chatId, {
          text: "❌ Failed to process view once video! Error: " + err.message,
          ...global.channelInfo,
        });
        return;
      }
    }

    // If we get here, it wasn't a view once message
    await sock.sendMessage(chatId, {
      text: "❌ This is not a view once message! Please reply to a view once image/video.",
      ...global.channelInfo,
    });
  } catch (error) {
    console.error("❌ Error in viewonce command:", error);
    await sock.sendMessage(chatId, {
      text: "❌ Error processing view once message! Error: " + error.message,
      ...global.channelInfo,
    });
  }
}

module.exports = viewOnceCommand;
