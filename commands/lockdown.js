/**
 * Lockdown Command
 * Emergency restriction mode
 * Owner only, no branding
 */

const botState = require("../lib/botState");
const { logAction, ACTIONS } = require("../lib/auditLog");

async function lockdownCommand(sock, chatId, message, args, ctx) {
  const subCmd = args[0]?.toLowerCase();

  // Show current status if no args
  if (!subCmd) {
    const info = botState.getLockdownInfo();
    const status = info.enabled ? "🔒 ENABLED" : "🔓 DISABLED";
    let msg = `*Lockdown Status:* ${status}`;

    if (info.enabled && info.enabledAt) {
      const enabledDate = new Date(info.enabledAt).toLocaleString();
      msg += `\n📅 Since: ${enabledDate}`;
    }

    msg += `\n\n*Usage:*\nlockdown on\nlockdown off`;

    return await sock.sendMessage(chatId, { text: msg });
  }

  // Handle on/off
  if (subCmd === "on" || subCmd === "enable") {
    if (botState.isLockdownEnabled()) {
      return await sock.sendMessage(chatId, {
        text: "🔒 Lockdown is already enabled.",
      });
    }

    botState.setLockdown(true, ctx.senderId);

    // Log the action
    logAction(
      ACTIONS.LOCKDOWN_TOGGLE,
      ctx.senderId,
      ctx.isGroup ? "group" : "private",
      {
        enabled: true,
      },
    );

    await sock.sendMessage(chatId, {
      text:
        "🔒 *Lockdown Enabled*\n\n" +
        "The following are now disabled:\n" +
        "• tagall\n" +
        "• listonline\n" +
        "• broadcast\n" +
        "• Non-owner admin commands\n\n" +
        "Only owner can use commands.",
    });
  } else if (subCmd === "off" || subCmd === "disable") {
    if (!botState.isLockdownEnabled()) {
      return await sock.sendMessage(chatId, {
        text: "🔓 Lockdown is already disabled.",
      });
    }

    botState.setLockdown(false, ctx.senderId);

    // Log the action
    logAction(
      ACTIONS.LOCKDOWN_TOGGLE,
      ctx.senderId,
      ctx.isGroup ? "group" : "private",
      {
        enabled: false,
      },
    );

    await sock.sendMessage(chatId, {
      text: "🔓 *Lockdown Disabled*\n\nAll commands are now available.",
    });
  } else {
    await sock.sendMessage(chatId, {
      text: "❌ Invalid option. Use: lockdown on | lockdown off",
    });
  }
}

// Command metadata for registration
lockdownCommand.meta = {
  name: "lockdown",
  aliases: ["ld"],
  ownerOnly: true,
  adminOnly: false,
  groupOnly: false,
  lockdownBlocked: false, // Owner can toggle even during lockdown
  ratelimited: false,
  silenceBlocked: false,
  description: "Emergency restriction mode",
};

module.exports = lockdownCommand;
