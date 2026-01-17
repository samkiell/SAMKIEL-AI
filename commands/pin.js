const isAdmin = require("../lib/isAdmin");
const { isOwner } = require("../lib/isOwner");
const { sendText } = require("../lib/sendResponse");

/**
 * Pin Command
 *
 * Pins or Unpins a quoted message in the group chat.
 * Requires Bot Admin and User Admin/Owner.
 */
async function pinCommand(sock, chatId, senderId, message, args = []) {
  try {
    const isGroup = chatId.endsWith("@g.us");
    if (!isGroup) {
      return await sendText(
        sock,
        chatId,
        "❌ This command can only be used in groups.",
        { quoted: message },
      );
    }

    const { isSenderAdmin, isBotAdmin } = await isAdmin(sock, chatId, senderId);
    const owner = await isOwner(senderId, sock);

    if (!isSenderAdmin && !owner) {
      return await sendText(
        sock,
        chatId,
        "❌ Only admins or the owner can manage pinned messages.",
        { quoted: message },
      );
    }

    if (!isBotAdmin) {
      return await sendText(
        sock,
        chatId,
        "❌ The bot needs to be an admin to manage pinned messages.",
        { quoted: message },
      );
    }

    const contextInfo = message.message?.extendedTextMessage?.contextInfo;
    const quoted = contextInfo?.quotedMessage;
    const quotedId = contextInfo?.stanzaId;
    const quotedParticipant = contextInfo?.participant;

    if (!quoted || !quotedId) {
      return await sendText(
        sock,
        chatId,
        "❌ Reply to a message you want to pin or unpin.",
        { quoted: message },
      );
    }

    // Determine if we are unpinning
    // Check if the first arg or the command trigger implies unpin
    const isUnpin =
      args[0]?.toLowerCase() === "unpin" || args[0]?.toLowerCase() === "off";

    // Build the message key for the quoted message
    const key = {
      remoteJid: chatId,
      fromMe:
        quotedParticipant === sock.user.id.split(":")[0] + "@s.whatsapp.net",
      id: quotedId,
      participant: quotedParticipant,
    };

    // Send Pin/Unpin Message
    // type: 1 to pin, 0 to unpin
    await sock.sendMessage(chatId, {
      pin: key,
      type: isUnpin ? 0 : 1,
      duration: isUnpin ? undefined : 86400, // 24 hours if pinning
    });

    await sendText(
      sock,
      chatId,
      isUnpin ? "✅ Message unpinned!" : "✅ Message pinned!",
      { quoted: message },
    );
  } catch (error) {
    console.error("Error in pin command:", error);
    await sendText(
      sock,
      chatId,
      "❌ Failed to process the request. Make sure the bot has permission.",
      { quoted: message },
    );
  }
}

module.exports = pinCommand;
