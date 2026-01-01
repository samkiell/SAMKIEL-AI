const isAdmin = require("../lib/isAdmin");

async function tagAllCommand(sock, chatId, senderId) {
  try {
    const { isSenderAdmin, isBotAdmin } = await isAdmin(sock, chatId, senderId);

    if (!isSenderAdmin && !isBotAdmin) {
      await sock.sendMessage(chatId, {
        text: "🚫 *Only admins can use the .tagall command.*",
        ...global.channelInfo,
      });
      return;
    }

    // Get group metadata
    const groupMetadata = await sock.groupMetadata(chatId);
    const participants = groupMetadata.participants;

    if (!participants || participants.length === 0) {
      await sock.sendMessage(chatId, {
        text: "❌ No participants found in the group.",
        ...global.channelInfo,
      });
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
      ...global.channelInfo,
    });
  } catch (error) {
    console.error("Error in tagall command:", error);
    await sock.sendMessage(chatId, {
      text: "❌ Failed to tag all members.",
      ...global.channelInfo,
    });
  }
}

module.exports = tagAllCommand;
