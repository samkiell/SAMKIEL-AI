const { isOwner } = require("../lib/isOwner");
const isAdmin = require("../lib/isAdmin");
const { downloadContentFromMessage } = require("@whiskeysockets/baileys");
const fs = require("fs");
const path = require("path");

/**
 * .creategc <name>
 * Creates a new group and returns the invite link.
 * Owner only.
 */
async function createGc(sock, chatId, message, args, senderId) {
  try {
    if (!(await isOwner(senderId))) {
      return sock.sendMessage(
        chatId,
        { text: "❌ High-level owner command only." },
        { quoted: message },
      );
    }

    const groupName = args.join(" ");
    if (!groupName) {
      return sock.sendMessage(
        chatId,
        { text: "⚠️ Provide a group name.\nExample: .creategc My New Group" },
        { quoted: message },
      );
    }

    await sock.sendMessage(chatId, {
      text: `⏳ Creating group "${groupName}"...`,
    });

    // Create Group (Add Bot Owner + Sender)
    // Note: sock.user.id is the bot. groupCreate auto-adds the creator (bot).
    // We try to add the sender if possible, but they must be in contacts or allow it.
    // Ideally we just create it with the bot, getting the link.
    const participants = [senderId];
    const group = await sock.groupCreate(groupName, participants);

    // Get Invite Link
    const code = await sock.groupInviteCode(group.id);
    const link = `https://chat.whatsapp.com/${code}`;

    await sock.sendMessage(
      chatId,
      {
        text: `✅ *Group Created Successfully!*\n\n🏷️ *Name:* ${groupName}\n🆔 *ID:* ${group.id}\n\n🔗 *Join Link:*\n${link}`,
      },
      { quoted: message },
    );
  } catch (err) {
    console.error("CreateGC Error:", err);
    await sock.sendMessage(
      chatId,
      {
        text: "❌ Failed to create group. Ensure I have permissions or valid participants.",
      },
      { quoted: message },
    );
  }
}

/**
 * .setgname <users>
 * Changes group subject.
 * Admin Only.
 */
async function setGroupName(sock, chatId, message, args, senderId) {
  if (!chatId.endsWith("@g.us"))
    return sock.sendMessage(
      chatId,
      { text: "❌ Group command only." },
      { quoted: message },
    );

  const checks = await isAdmin(sock, chatId, senderId);
  if (!checks.isSenderAdmin && !checks.isGroupOwner) {
    return sock.sendMessage(
      chatId,
      { text: "❌ You must be an admin to use this." },
      { quoted: message },
    );
  }
  if (!checks.isBotAdmin) {
    return sock.sendMessage(
      chatId,
      { text: "❌ I need to be an Admin first." },
      { quoted: message },
    );
  }

  const newName = args.join(" ");
  if (!newName)
    return sock.sendMessage(
      chatId,
      { text: "⚠️ Provide a new name." },
      { quoted: message },
    );

  try {
    await sock.groupUpdateSubject(chatId, newName);
    await sock.sendMessage(
      chatId,
      { text: `✅ Group name changed to: *${newName}*` },
      { quoted: message },
    );
  } catch (e) {
    await sock.sendMessage(
      chatId,
      { text: "❌ Failed to update name." },
      { quoted: message },
    );
  }
}

/**
 * .setgdesc <text>
 * Changes group description.
 * Admin Only.
 */
async function setGroupDesc(sock, chatId, message, args, senderId) {
  if (!chatId.endsWith("@g.us"))
    return sock.sendMessage(
      chatId,
      { text: "❌ Group command only." },
      { quoted: message },
    );

  const checks = await isAdmin(sock, chatId, senderId);
  if (!checks.isSenderAdmin && !checks.isGroupOwner) {
    return sock.sendMessage(
      chatId,
      { text: "❌ You must be an admin to use this." },
      { quoted: message },
    );
  }
  if (!checks.isBotAdmin) {
    return sock.sendMessage(
      chatId,
      { text: "❌ I need to be an Admin first." },
      { quoted: message },
    );
  }

  const newDesc = args.join(" ");
  if (!newDesc)
    return sock.sendMessage(
      chatId,
      { text: "⚠️ Provide a new description." },
      { quoted: message },
    );

  try {
    await sock.groupUpdateDescription(chatId, newDesc);
    await sock.sendMessage(
      chatId,
      { text: `✅ Group description updated.` },
      { quoted: message },
    );
  } catch (e) {
    await sock.sendMessage(
      chatId,
      { text: "❌ Failed to update description." },
      { quoted: message },
    );
  }
}

/**
 * .setgpp
 * Update Group Icon.
 * Admin Only.
 */
async function setGroupPP(sock, chatId, message, args, senderId) {
  if (!chatId.endsWith("@g.us"))
    return sock.sendMessage(
      chatId,
      { text: "❌ Group command only." },
      { quoted: message },
    );

  const checks = await isAdmin(sock, chatId, senderId);
  if (!checks.isSenderAdmin && !checks.isGroupOwner) {
    return sock.sendMessage(
      chatId,
      { text: "❌ You must be an admin to use this." },
      { quoted: message },
    );
  }
  if (!checks.isBotAdmin) {
    return sock.sendMessage(
      chatId,
      { text: "❌ I need to be an Admin first." },
      { quoted: message },
    );
  }

  const quoted =
    message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
  const mime =
    quoted?.imageMessage?.mimetype || message.message?.imageMessage?.mimetype;

  if (!mime || !mime.includes("image")) {
    return sock.sendMessage(
      chatId,
      { text: "⚠️ Reply to an image to set as group icon." },
      { quoted: message },
    );
  }

  try {
    const stream = await downloadContentFromMessage(
      quoted ? quoted.imageMessage : message.message.imageMessage,
      "image",
    );
    let buffer = Buffer.from([]);
    for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);

    // Save temp
    const tempPath = path.join(__dirname, `../tmp/pp_${Date.now()}.jpg`);
    fs.writeFileSync(tempPath, buffer);

    await sock.updateProfilePicture(chatId, { url: tempPath });
    fs.unlinkSync(tempPath);

    await sock.sendMessage(
      chatId,
      { text: "✅ Group icon updated." },
      { quoted: message },
    );
  } catch (e) {
    console.error("SetGPP Error:", e);
    await sock.sendMessage(
      chatId,
      { text: "❌ Failed to update icon." },
      { quoted: message },
    );
  }
}

module.exports = {
  createGc,
  setGroupName,
  setGroupDesc,
  setGroupPP,
};
