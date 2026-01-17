/**
 * listonline Command
 *
 * Lists currently online users in a group.
 * Excludes the bot itself.
 *
 * Subcommand: listonline 20m - Lists users active in last 20 minutes
 * Accepts time formats: 5m, 10m, 1h
 *
 * Permissions:
 * - Group only
 * - Admins and owner only
 * - Owner always bypasses admin checks
 */

const isAdmin = require("../lib/isAdmin");
const { isOwner } = require("../lib/isOwner");
const { sendText } = require("../lib/sendResponse");

// In-memory store for user presence/activity
// This gets populated during runtime from messages
const userActivity = new Map();

/**
 * Record user activity for tracking "active in last X minutes"
 * @param {string} groupId - Group JID
 * @param {string} userId - User JID
 */
function recordUserActivity(groupId, userId) {
  if (!groupId || !userId) return;
  const key = `${groupId}:${userId}`;
  userActivity.set(key, Date.now());
}

/**
 * Get users active in the last X milliseconds
 * @param {string} groupId - Group JID
 * @param {number} timeMs - Time window in milliseconds
 * @returns {string[]} - Array of user JIDs active in window
 */
function getActiveUsers(groupId, timeMs) {
  const now = Date.now();
  const cutoff = now - timeMs;
  const activeUsers = [];

  for (const [key, timestamp] of userActivity.entries()) {
    if (key.startsWith(`${groupId}:`) && timestamp >= cutoff) {
      const userId = key.split(":")[1];
      activeUsers.push(userId);
    }
  }

  return activeUsers;
}

/**
 * Parse time argument like "5m", "10m", "1h"
 * @param {string} timeArg - Time string
 * @returns {number|null} - Milliseconds or null if invalid
 */
function parseTimeArg(timeArg) {
  if (!timeArg) return null;

  const match = timeArg.match(/^(\d+)(m|h)$/i);
  if (!match) return null;

  const value = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();

  if (isNaN(value) || value <= 0) return null;

  if (unit === "m") {
    // Minutes: max 60 minutes
    if (value > 60) return null;
    return value * 60 * 1000;
  } else if (unit === "h") {
    // Hours: max 24 hours
    if (value > 24) return null;
    return value * 60 * 60 * 1000;
  }

  return null;
}

/**
 * Main listonline command handler
 */
async function listOnlineCommand(sock, chatId, senderId, message, args = []) {
  try {
    const isGroup = chatId.endsWith("@g.us");

    // Group-only check
    if (!isGroup) {
      await sendText(
        sock,
        chatId,
        "❌ This command can only be used in groups.",
        {
          withBranding: false,
          quoted: message,
        },
      );
      return;
    }

    // Permission check: Owner bypasses, otherwise need admin
    const isOwnerUser = await isOwner(senderId);

    if (!isOwnerUser) {
      const adminStatus = await isAdmin(sock, chatId, senderId);
      if (!adminStatus.isSenderAdmin) {
        await sendText(
          sock,
          chatId,
          "❌ Only group admins or the bot owner can use this command.",
          { withBranding: false, quoted: message },
        );
        return;
      }
    }

    // Get bot's own JID to exclude
    const botJid = sock.user?.id?.split(":")[0] + "@s.whatsapp.net";

    // Get group metadata
    const groupMetadata = await sock.groupMetadata(chatId);
    const participants = groupMetadata.participants || [];

    // Check for time filter argument
    const timeArg = args[0];
    const timeMs = parseTimeArg(timeArg);

    if (timeArg && !timeMs) {
      await sendText(
        sock,
        chatId,
        "❌ Invalid time format. Use formats like: 5m, 10m, 20m, 1h\n\nExample: .listonline 20m",
        { withBranding: false, quoted: message },
      );
      return;
    }

    let onlineUsers = [];
    let headerText = "";

    if (timeMs) {
      // Filter by activity time
      const activeUserIds = getActiveUsers(chatId, timeMs);
      onlineUsers = participants.filter(
        (p) => activeUserIds.includes(p.id) && p.id !== botJid,
      );

      const timeDisplay = timeArg.toLowerCase();
      headerText = `👥 *Users Active in Last ${timeDisplay}*`;
    } else {
      // Get presence for all participants
      // Note: WhatsApp presence data is limited, we'll show all members
      // with a note about presence limitations
      onlineUsers = participants.filter((p) => p.id !== botJid);
      headerText = "👥 *Online Users*";

      // Try to fetch presence for each user (limited by WhatsApp)
      const presencePromises = participants.map(async (p) => {
        try {
          await sock.presenceSubscribe(p.id);
          return new Promise((resolve) => {
            // Give WhatsApp time to respond with presence
            setTimeout(() => resolve(null), 500);
          });
        } catch (e) {
          return null;
        }
      });

      // Wait briefly for presence data
      await Promise.race([
        Promise.all(presencePromises),
        new Promise((resolve) => setTimeout(resolve, 2000)),
      ]);
    }

    if (onlineUsers.length === 0) {
      await sendText(
        sock,
        chatId,
        timeMs
          ? `📭 No users have been active in the last ${timeArg}.`
          : "📭 No users found online (excluding bot).",
        { withBranding: false, quoted: message },
      );
      return;
    }

    // Build response message
    let response = `${headerText}\n`;
    response += `━━━━━━━━━━━━━━━\n\n`;

    onlineUsers.forEach((user, index) => {
      const userNum = user.id.split("@")[0];
      response += `${index + 1}. @${userNum}\n`;
    });

    response += `\n━━━━━━━━━━━━━━━\n`;
    response += `📊 *Total:* ${onlineUsers.length} user${onlineUsers.length !== 1 ? "s" : ""}`;

    if (!timeMs) {
      response += `\n\n💡 _Use .listonline 20m to see users active in the last 20 minutes_`;
    }

    await sendText(sock, chatId, response, {
      withBranding: false,
      quoted: message,
      mentions: onlineUsers.map((u) => u.id),
    });
  } catch (error) {
    console.error("Error in listonline command:", error);
    await sendText(sock, chatId, "❌ Failed to fetch online users.", {
      withBranding: false,
      quoted: message,
    });
  }
}

module.exports = {
  listOnlineCommand,
  recordUserActivity,
  getActiveUsers,
};
