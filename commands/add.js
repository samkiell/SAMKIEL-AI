const isAdmin = require("../lib/isAdmin");
const { getCommand } = require("../lib/prefix");

// Helper to format phone numbers
function formatJid(number) {
  number = number.replace(/\D/g, ""); // Remove non-digits
  return number.endsWith("@s.whatsapp.net")
    ? number
    : number + "@s.whatsapp.net";
}

async function addCommand(sock, chatId, senderId, message, args) {
  const { isSenderAdmin, isBotAdmin } = await isAdmin(sock, chatId, senderId);

  // 1. Bot Admin Check
  if (!isBotAdmin) {
    await sock.sendMessage(
      chatId,
      { text: "❌ I need to be an Admin to add members!" },
      { quoted: message }
    );
    return;
  }

  // 2. Sender Admin Check
  if (!isSenderAdmin) {
    await sock.sendMessage(
      chatId,
      { text: "❌ Only admins can use this command!" },
      { quoted: message }
    );
    return;
  }

  let usersToAdd = [];

  // 3. Check for quoted message
  if (message.message?.extendedTextMessage?.contextInfo?.participant) {
    const quotedJid =
      message.message.extendedTextMessage.contextInfo.participant;
    usersToAdd.push(quotedJid);
  }
  // 4. Check for arguments (phone numbers)
  else if (args && args.length > 0) {
    // Handle multiple numbers separated by space or comma
    const rawNumbers = args.join(" ").split(/[, ]+/);
    for (let num of rawNumbers) {
      num = num.trim();
      if (num) {
        // Basic validation: length check (optional, but good for filtering garbage)
        if (num.length > 7 && num.length < 16) {
          usersToAdd.push(formatJid(num));
        }
      }
    }
  }

  if (usersToAdd.length === 0) {
    await sock.sendMessage(
      chatId,
      {
        text: "❌ Please provide a phone number or reply to a user.\nExample:\n.add 2348012345678\n.add 919876543210",
      },
      { quoted: message }
    );
    return;
  }

  // 5. Execute Add
  try {
    const response = await sock.groupParticipantsUpdate(
      chatId,
      usersToAdd,
      "add"
    );

    // Analyze response (Baileys returns status for each JID)
    // 403: Forbidden (Privacy settings)
    // 408: Request Timeout
    // 409: Conflict (Already in group)
    // 200: Success

    let successCount = 0;
    let privacyCount = 0;
    let existingCount = 0;

    // response is usually array of { status: '200', jid: '...' }
    // or sometimes just null/void depending on version, but typically array.

    if (response && response.length > 0) {
      for (const res of response) {
        if (res.status === "200") {
          successCount++;
        } else if (res.status === "403") {
          console.log(`Failed to add ${res.jid} due to privacy settings.`);
          privacyCount++;
          // Try to send invite link if privacy restricted?
          // Optional enhancement
        } else if (res.status === "409") {
          existingCount++;
        }
      }
    } else {
      // Assume success if no error thrown?
      // Actually Baileys usually returns data.
      successCount = usersToAdd.length;
    }

    let msgText = "";
    if (successCount > 0) {
      msgText += `✅ Successfully added ${successCount} member(s)!`;
    }
    if (privacyCount > 0) {
      msgText += `\n⚠️ Could not add ${privacyCount} user(s) due to their privacy settings.`;
    }
    if (existingCount > 0) {
      msgText += `\nℹ️ ${existingCount} user(s) are already in the group.`;
    }

    await sock.sendMessage(
      chatId,
      {
        text: msgText.trim(),
        contextInfo: {
          forwardingScore: 1,
          isForwarded: true,
          forwardedNewsletterMessageInfo: {
            newsletterJid: "120363400862271383@newsletter",
            newsletterName: "𝕊𝔸𝕄𝕂𝕀𝔼𝕃 𝔹𝕆𝕋",
            serverMessageId: -1,
          },
        },
      },
      { quoted: message }
    );
  } catch (error) {
    console.error("Error in add command:", error);
    await sock.sendMessage(
      chatId,
      {
        text: "❌ Failed to add user(s). Ensure the number is correct and valid on WhatsApp.",
      },
      { quoted: message }
    );
  }
}

module.exports = addCommand;
