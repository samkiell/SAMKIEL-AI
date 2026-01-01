const fs = require("fs");
const path = require("path");
const { downloadMediaMessage } = require("@whiskeysockets/baileys");
const webp = require("node-webpmux");
const crypto = require("crypto");

async function takeCommand(sock, chatId, message, args) {
  try {
    // Check if message is a reply to a sticker
    const quotedMessage =
      message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    if (!quotedMessage?.stickerMessage) {
      await sock.sendMessage(chatId, {
        text: "❌ Reply to a sticker with .take <packname>",
        ...global.channelInfo,
      });
      return;
    }

    // Get the packname from args or use default
    const packname = args.join(" ") || "𝕊𝔸𝕄𝕂𝕀𝔼𝕃 𝔹𝕆𝕋";

    try {
      // Download the sticker
      const stickerBuffer = await downloadMediaMessage(
        {
          key: message.message.extendedTextMessage.contextInfo.stanzaId,
          message: quotedMessage,
          messageType: "stickerMessage",
        },
        "buffer",
        {},
        {
          logger: console,
          reuploadRequest: sock.updateMediaMessage,
        }
      );

      if (!stickerBuffer) {
        await sock.sendMessage(chatId, {
          text: "❌ Failed to download sticker",
          ...global.channelInfo,
        });
        return;
      }

      // Add metadata using webpmux
      const img = new webp.Image();
      await img.load(stickerBuffer);

      // Create metadata
      const json = {
        "sticker-pack-id": crypto.randomBytes(32).toString("hex"),
        "sticker-pack-name": packname,
        emojis: ["🤖"],
      };

      // Create exif buffer
      const exifAttr = Buffer.from([
        0x49, 0x49, 0x2a, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57,
        0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00,
      ]);
      const jsonBuffer = Buffer.from(JSON.stringify(json), "utf8");
      const exif = Buffer.concat([exifAttr, jsonBuffer]);
      exif.writeUIntLE(jsonBuffer.length, 14, 4);

      // Set the exif data
      img.exif = exif;

      // Get the final buffer with metadata
      const finalBuffer = await img.save(null);

      // Send the sticker
      await sock.sendMessage(chatId, {
        sticker: finalBuffer,
        ...global.channelInfo,
      });
    } catch (error) {
      console.error("Sticker processing error:", error);
      await sock.sendMessage(chatId, {
        text: "❌ Error processing sticker",
        ...global.channelInfo,
      });
    }
  } catch (error) {
    console.error("Error in take command:", error);
    await sock.sendMessage(chatId, {
      text: "❌ Error processing command",
      ...global.channelInfo,
    });
  }
}

module.exports = takeCommand;
