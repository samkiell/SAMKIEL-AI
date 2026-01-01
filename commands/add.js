const isAdmin = require("../lib/isAdmin");
const { getCommand, loadPrefix } = require("../lib/prefix");

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

  const currentPrefix = loadPrefix();
  const p = currentPrefix === "off" ? "" : currentPrefix;

  if (usersToAdd.length === 0) {
    await sock.sendMessage(
      chatId,
      {
        text: `❌ Please provide a phone number or reply to a user.\nExample:\n${p}add 2348012345678\n${p}add 919876543210`,
      },
      { quoted: message }
    );
    return;
  }

  // 5. Execute Add
  console.log(
    `Add Command: Trying to add ${usersToAdd.join(", ")} to ${chatId}`
  );

  try {
    const response = await sock.groupParticipantsUpdate(
      chatId,
      usersToAdd,
      "add"
    );
    console.log("Add Command Response:", response);

    // Analyze response (Baileys returns status for each JID)
    // 403: Forbidden (Privacy settings)
    // 408: Request Timeout
    // 409: Conflict (Already in group)
    // 200: Success
    // 400: Invalid Request (Malformed JID often causes this)

    let successCount = 0;
    let privacyCount = 0;
    let existingCount = 0;
    let invalidCount = 0;

    // response is typically array of { status: '200', jid: '...' }
    if (response && Array.isArray(response)) {
      for (const res of response) {
        if (res.status === "200") {
          successCount++;
        } else if (res.status === "403") {
          console.log(`Failed to add ${res.jid} due to privacy settings.`);
          privacyCount++;
        } else if (res.status === "409") {
          existingCount++;
        } else if (res.status === "400") {
          invalidCount++;
        } else if (res.status === "404") {
          invalidCount++;
        }
      }
    } else {
      // If response is not an array, it might be a silent success or weird state.
      // But usually it returns data.
      if (!response) {
        console.warn("Add command: No response object returned.");
      }
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
    if (invalidCount > 0) {
      msgText += `\n❌ ${invalidCount} number(s) were invalid or not on WhatsApp.`;
    }
    // If we have users but 0 success/fail counts (e.g. empty response array), we should warn
    if (
      usersToAdd.length > 0 &&
      successCount === 0 &&
      privacyCount === 0 &&
      existingCount === 0 &&
      invalidCount === 0
    ) {
      msgText += `\n❓ Command executed but no specific status returned. (Possible success)`;
    }

    await sock.sendMessage(
      chatId,
      {
        text: msgText.trim() || "❓ No changes made (Unknown status).",
        ...global.channelInfo,
      },
      { quoted: message }
    );
  } catch (error) {
    console.error("Error in add command:", error);
    const errorMessage = error.message || String(error);
    await sock.sendMessage(
      chatId,
      {
        text: `❌ Failed to add user(s).\nError: ${errorMessage}`,
        ...global.channelInfo,
      },
      { quoted: message }
    );
  }
}

module.exports = addCommand;
