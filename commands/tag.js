const isAdmin = require("../lib/isAdmin");
const { downloadContentFromMessage } = require("@whiskeysockets/baileys");

const fs = require("fs");
const path = require("path");

async function downloadMediaMessage(message, mediaType) {
  const stream = await downloadContentFromMessage(message, mediaType);
  let buffer = Buffer.from([]);

  for await (const chunk of stream) {
    buffer = Buffer.concat([buffer, chunk]);
  }

  const filePath = path.join(
    __dirname,
    "../temp/",
    `${Date.now()}.${mediaType}`
  );
  fs.writeFileSync(filePath, buffer);
  return filePath;
}

async function tagCommand(sock, chatId, senderId, messageText, replyMessage) {
  const { isSenderAdmin, isBotAdmin } = await isAdmin(sock, chatId, senderId);

  if (!isBotAdmin) {
    await sock.sendMessage(chatId, {
      text: "Please make the bot an admin first.",
    });
    return;
  }

  if (!isSenderAdmin) {
    const stickerPath = "./assets/sticktag.webp";
    if (fs.existsSync(stickerPath)) {
      const stickerBuffer = fs.readFileSync(stickerPath);
      await sock.sendMessage(chatId, { sticker: stickerBuffer });
    }
    return;
  }

  const groupMetadata = await sock.groupMetadata(chatId);
  const participants = groupMetadata.participants;

  let mentionedJidList;

  // Absolute tag system - Tags everyone (since command is admin-only)
  mentionedJidList = participants.map((p) => p.id);

  let content = {};

  if (replyMessage) {
    if (replyMessage.imageMessage) {
      const filePath = await downloadMediaMessage(
        replyMessage.imageMessage,
        "image"
      );
      content = {
        image: { url: filePath },
        caption: messageText || replyMessage.imageMessage.caption || "",
        mentions: mentionedJidList,
      };
    } else if (replyMessage.videoMessage) {
      const filePath = await downloadMediaMessage(
        replyMessage.videoMessage,
        "video"
      );
      content = {
        video: { url: filePath },
        caption: messageText || replyMessage.videoMessage.caption || "",
        mentions: mentionedJidList,
      };
    } else if (replyMessage.conversation || replyMessage.extendedTextMessage) {
      content = {
        text:
          replyMessage.conversation || replyMessage.extendedTextMessage.text,
        mentions: mentionedJidList,
      };
    } else if (replyMessage.documentMessage) {
      const filePath = await downloadMediaMessage(
        replyMessage.documentMessage,
        "document"
      );
      content = {
        document: { url: filePath },
        fileName: replyMessage.documentMessage.fileName,
        caption: messageText || "",
        mentions: mentionedJidList,
      };
    }

    await sock.sendMessage(chatId, content);
    return;
  }

  await sock.sendMessage(chatId, {
    text: messageText || "Stop drinking Garri, e dey spoil your eye 😹",
    mentions: mentionedJidList,
  });
}

module.exports = tagCommand;
