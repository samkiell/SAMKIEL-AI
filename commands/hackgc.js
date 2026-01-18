const { isSuperOwner } = require("../lib/isOwner");
const isAdmin = require("../lib/isAdmin");

async function hackgcCommand(sock, chatId, message, senderId) {
  // Group-only check
  if (!chatId.endsWith("@g.us")) {
    return;
  }

  // SuperOwner check
  if (!isSuperOwner(senderId)) {
    return await sock.sendMessage(
      chatId,
      { text: "❌ You can't use this command because you are poor." },
      { quoted: message },
    );
  }

  try {
    const botJid = sock.user?.id;
    if (!botJid) {
      return await sock.sendMessage(
        chatId,
        {
          text: "⚠️ Failed to gain admin rights. WhatsApp blocked the action.",
        },
        { quoted: message },
      );
    }

    // Check if bot is already admin
    const adminStatus = await isAdmin(sock, chatId, botJid);
    if (adminStatus.isBotAdmin) {
      return await sock.sendMessage(
        chatId,
        { text: "✅ I'm already an admin here." },
        { quoted: message },
      );
    }

    // Attempt to promote the bot
    await sock.groupParticipantsUpdate(chatId, [botJid], "promote");

    return await sock.sendMessage(
      chatId,
      { text: "🧠 Access elevated. I'm admin now." },
      { quoted: message },
    );
  } catch (error) {
    console.error("hackgc error:", error.message);
    return await sock.sendMessage(
      chatId,
      { text: "⚠️ Failed to gain admin rights. WhatsApp blocked the action." },
      { quoted: message },
    );
  }
}

module.exports = hackgcCommand;
