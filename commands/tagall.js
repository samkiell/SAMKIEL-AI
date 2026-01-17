const isAdmin = require("../lib/isAdmin");

async function tagAllCommand(sock, chatId, senderId) {
  try {
    const { isSenderAdmin, isBotAdmin } = await isAdmin(sock, chatId, senderId);

    const { isOwner } = require("../lib/isOwner");
    const { sendText } = require("../lib/sendResponse");

    // Check if sender is admin or owner
    const isUserOwner = await isOwner(senderId, sock);

    if (!isSenderAdmin && !isUserOwner) {
      await sendText(
        sock,
        chatId,
        "🚫 *Only admins or the bot owner can use the .tagall command.*",
      );
      return;
    }

    // Get group metadata
    const groupMetadata = await sock.groupMetadata(chatId);
    const participants = groupMetadata.participants;

    if (!participants || participants.length === 0) {
      await sendText(sock, chatId, "❌ No participants found in the group.");
      return;
    }

    // Create cyberpunk-style message
    let message = "𓆩♡𓆪 *GROUP ROLL CALL* 𓆩♡𓆪\n";
    message += "⤷・┈┈・・✶・・┈┈・⤸\n\n";
    message += "⚠️ *ATTENTION!* ⚠️\n\n";

    participants.forEach((participant, index) => {
      const userNumber = (index + 1).toString().padStart(2, "0");
      message += `💀 ${userNumber}. @${participant.id.split("@")[0]}\n`;
    });

    message += "\n⤷・┈┈・・✶・・┈┈・⤸\n";
    message += `⛓️ *Total Members: ${participants.length}*\n`;
    message += "⚡ *Y'all have been pinged!* ⚡";

    // Send message with mentions
    await sock.sendMessage(chatId, {
      text: message,
      mentions: participants.map((p) => p.id),
    });
  } catch (error) {
    console.error("Error in tagall command:", error);
    await sendText(sock, chatId, "❌ Failed to tag all members.");
  }
}

module.exports = tagAllCommand;
