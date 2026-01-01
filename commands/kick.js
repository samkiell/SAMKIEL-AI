const isAdmin = require("../lib/isAdmin");

async function kickCommand(sock, chatId, senderId, mentionedJids, message) {
  // Check if user is owner
  const isOwner = message.key.fromMe;
  if (!isOwner) {
    const { isSenderAdmin, isBotAdmin } = await isAdmin(sock, chatId, senderId);

    if (!isBotAdmin) {
      await sock.sendMessage(
        chatId,
        {
          text: "❌ Please make the bot an admin first.",
          ...global.channelInfo,
        },
        { quoted: message }
      );
      return;
    }

    if (!isSenderAdmin) {
      await sock.sendMessage(
        chatId,
        {
          text: "❌ Only group admins can use the kick command.",
          ...global.channelInfo,
        },
        { quoted: message }
      );
      return;
    }
  }

  let usersToKick = [];

  // Check for mentioned users
  if (mentionedJids && mentionedJids.length > 0) {
    usersToKick = mentionedJids;
  }
  // Check for replied message
  else if (message.message?.extendedTextMessage?.contextInfo?.participant) {
    usersToKick = [message.message.extendedTextMessage.contextInfo.participant];
  }

  // If no user found through either method
  if (usersToKick.length === 0) {
    await sock.sendMessage(
      chatId,
      {
        text: "❌ Please mention the user or reply to their message to kick!",
        ...global.channelInfo,
      },
      { quoted: message }
    );
    return;
  }

  // Get bot's ID
  const botId = sock.user.id.split(":")[0] + "@s.whatsapp.net";

  // Check if any of the users to kick is the bot itself
  if (usersToKick.includes(botId)) {
    await sock.sendMessage(
      chatId,
      {
        text: "❌ I can't kick myself! 🤖",
        ...global.channelInfo,
      },
      { quoted: message }
    );
    return;
  }

  try {
    const response = await sock.groupParticipantsUpdate(
      chatId,
      usersToKick,
      "remove"
    );
    console.log("Kick Response:", response);

    // Get usernames for each kicked user
    const usernames = await Promise.all(
      usersToKick.map(async (jid) => {
        return `@${jid.split("@")[0]}`;
      })
    );

    await sock.sendMessage(
      chatId,
      {
        text: `✅ ${usernames.join(", ")} has been kicked successfully!`,
        mentions: usersToKick,
        ...global.channelInfo,
      },
      { quoted: message }
    );
  } catch (error) {
    console.error("Error in kick command:", error);
    await sock.sendMessage(
      chatId,
      {
        text: `❌ Failed to kick user(s)!\nError: ${
          error.message || String(error)
        }`,
        ...global.channelInfo,
      },
      { quoted: message }
    );
  }
}

module.exports = kickCommand;
