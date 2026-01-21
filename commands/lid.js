module.exports = async function lidCommand(sock, chatId, senderId, message) {
  try {
    // 1. Extract the text content to find arguments
    const text =
      message.message?.conversation ||
      message.message?.extendedTextMessage?.text ||
      "";
    const args = text.trim().split(/\s+/);

    let targetJid = null;

    // 2. Determine target
    // Case A: Quoted Message
    const quotedContext = message.message?.extendedTextMessage?.contextInfo;
    if (quotedContext?.participant) {
      targetJid = quotedContext.participant;
    }
    // Case B: Explicit Number in arguments (e.g. .lid 23480...)
    else if (args.length > 1) {
      // Remove symbols and ensure format
      const potentialNum = args[1].replace(/[^0-9]/g, "");
      if (potentialNum) {
        targetJid = potentialNum + "@s.whatsapp.net";
      }
    }
    // Case C: Mentions
    else if (
      quotedContext?.mentionedJid &&
      quotedContext.mentionedJid.length > 0
    ) {
      targetJid = quotedContext.mentionedJid[0];
    }
    // Case D: Fallback to sender
    else {
      targetJid = senderId;
    }

    if (!targetJid) {
      await sock.sendMessage(
        chatId,
        {
          text: "❌ Could not determine target user.\n\n> *Powered by SAMKIEL BOT*",
        },
        { quoted: message },
      );
      return;
    }

    // 3. Query WhatsApp for LID details
    // onWhatsApp returns [{ jid, exists, lid }]
    const result = await sock.onWhatsApp(targetJid);

    if (!result || result.length === 0) {
      await sock.sendMessage(
        chatId,
        {
          text: `❌ usage: .lid 2348087357158 \n\nThe number @${
            targetJid.split("@")[0]
          } is not registered on WhatsApp.\n\n> *Powered by SAMKIEL BOT*`,
          mentions: [targetJid],
        },
        { quoted: message },
      );
      return;
    }

    const userData = result[0]; // Take the first match
    if (!userData.lid) {
      // Sometimes just doesn't return it?
      await sock.sendMessage(
        chatId,
        {
          text: `❌ Could not fetch LID for @${targetJid.split("@")[0]}.\n\n> *Powered by SAMKIEL BOT*`,
          mentions: [targetJid],
        },
        { quoted: message },
      );
      return;
    }

    // 4. Send Response
    await sock.sendMessage(
      chatId,
      {
        text: `🔍 *LID Lookup*\n\n👤 *User:* @${
          targetJid.split("@")[0]
        }\n🆔 *LID:* \`${userData.lid}\`\n\n> *Powered by SAMKIEL BOT*`,
        mentions: [targetJid],
      },
      { quoted: message },
    );
  } catch (err) {
    console.error("Error in lid command:", err);
    await sock.sendMessage(
      chatId,
      {
        text: "❌ An error occurred while fetching the LID.\n\n> *Powered by SAMKIEL BOT*",
      },
      { quoted: message },
    );
  }
};
