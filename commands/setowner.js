/**
 * Set Owner Command
 * Allows owners/super owners to add new owners via reply or phone number
 */

const fs = require("fs");
const path = require("path");
const {
  isOwner,
  isSuperOwner,
  loadOwnerData,
  saveOwnerData,
  normalizeToNumber,
} = require("../lib/isOwner");

/**
 * Validate phone number format
 * Accepts formats: +234xxx, 234xxx, 08xxx (Nigerian), etc.
 */
function validatePhoneNumber(input) {
  if (!input) return null;

  // Remove common prefixes and clean
  let cleaned = String(input)
    .replace(/^\+/, "")
    .replace(/[\s\-()]/g, "")
    .replace(/[^0-9]/g, "");

  // Handle Nigerian local format (08xxx -> 234xxx)
  if (cleaned.startsWith("0") && cleaned.length === 11) {
    cleaned = "234" + cleaned.slice(1);
  }

  // Must have at least 10 digits
  if (cleaned.length < 10) return null;

  return cleaned;
}

/**
 * Check if owner already exists
 */
function ownerExists(ownerData, number) {
  const normalizedNum = normalizeToNumber(number);

  // Check superOwner
  const superOwners = Array.isArray(ownerData.superOwner)
    ? ownerData.superOwner
    : [ownerData.superOwner];
  if (superOwners.some((s) => normalizeToNumber(s) === normalizedNum)) {
    return { exists: true, type: "superOwner" };
  }

  // Check owners array
  const owners = Array.isArray(ownerData.owners) ? ownerData.owners : [];
  const found = owners.find((o) => {
    const num =
      typeof o === "object"
        ? normalizeToNumber(o.number || o.jid || "")
        : normalizeToNumber(o);
    const lid = typeof o === "object" ? normalizeToNumber(o.lid || "") : "";
    return num === normalizedNum || (lid && lid === normalizedNum);
  });

  if (found) {
    return { exists: true, type: "owner" };
  }

  return { exists: false };
}

/**
 * Set Owner Command Handler
 */
async function setOwnerCommand(sock, chatId, message, args) {
  const senderId = message.key.participant || message.key.remoteJid;

  // Only owners and super owners can add new owners
  const isOwnerUser = await isOwner(senderId, sock);
  const isSuperOwnerUser = isSuperOwner(senderId);

  if (!isOwnerUser && !isSuperOwnerUser) {
    await sock.sendMessage(chatId, {
      text: "❌ Only owners can use this command.",
    });
    return;
  }

  let targetNumber = null;
  let targetLid = null;
  let targetUser = null;

  // Method 1: Reply-based
  const quotedMessage = message.message?.extendedTextMessage?.contextInfo;
  if (quotedMessage?.participant) {
    targetUser = quotedMessage.participant;
    targetNumber = normalizeToNumber(targetUser);

    // Try to get LID if available
    try {
      const result = await sock.onWhatsApp(targetNumber + "@s.whatsapp.net");
      if (result && result.length > 0 && result[0].lid) {
        targetLid = normalizeToNumber(result[0].lid);
      }
    } catch (e) {
      // LID resolution failed, continue without it
    }
  }
  // Method 2: Number-based
  else if (args.length > 0) {
    const inputNumber = args.join("");
    targetNumber = validatePhoneNumber(inputNumber);

    if (!targetNumber) {
      await sock.sendMessage(chatId, {
        text: "❌ Invalid phone number format.\n\n*Usage:*\n• Reply to a message: `.setowner`\n• With number: `.setowner +234xxxxxxxxxx`\n\n_Supported formats: +234xxx, 234xxx, 08xxx_",
      });
      return;
    }

    targetUser = targetNumber + "@s.whatsapp.net";

    // Try to get LID
    try {
      const result = await sock.onWhatsApp(targetUser);
      if (result && result.length > 0 && result[0].lid) {
        targetLid = normalizeToNumber(result[0].lid);
      }
    } catch (e) {
      // LID resolution failed, continue without it
    }
  } else {
    await sock.sendMessage(chatId, {
      text: "🔰 *Set Owner Command*\n\n*Usage:*\n• Reply to a message: `.setowner`\n• With number: `.setowner +234xxxxxxxxxx`\n\n_This will grant the user owner permissions._",
    });
    return;
  }

  // Load current owner data
  const ownerData = loadOwnerData();

  // Check for duplicates
  const existsCheck = ownerExists(ownerData, targetNumber);
  if (existsCheck.exists) {
    const typeLabel =
      existsCheck.type === "superOwner" ? "super owner" : "owner";
    await sock.sendMessage(chatId, {
      text: `⚠️ This user is already a ${typeLabel}.\n\n*Number:* ${targetNumber}`,
    });
    return;
  }

  // Initialize owners array if needed
  if (!Array.isArray(ownerData.owners)) {
    ownerData.owners = [];
  }

  // Add new owner
  const newOwner = {
    number: targetNumber,
  };
  if (targetLid) {
    newOwner.lid = targetLid;
  }

  ownerData.owners.push(newOwner);

  // Save
  if (saveOwnerData(ownerData)) {
    let successMsg = `✅ *New Owner Added*\n\n*Number:* ${targetNumber}`;
    if (targetLid) {
      successMsg += `\n*LID:* ${targetLid}`;
    }
    successMsg += "\n\n_This user now has owner permissions._";

    await sock.sendMessage(chatId, {
      text: successMsg,
      mentions: targetUser ? [targetUser] : [],
    });

    console.log(
      `[SetOwner] Added new owner: ${targetNumber}${targetLid ? ` (LID: ${targetLid})` : ""}`,
    );
  } else {
    await sock.sendMessage(chatId, {
      text: "❌ Failed to save owner data. Please try again.",
    });
  }
}

module.exports = setOwnerCommand;
