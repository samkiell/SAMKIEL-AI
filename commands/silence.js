/**
 * Silence Command
 * Temporary quiet mode - bot only responds to owner
 * Owner only, no branding
 */

const botState = require("../lib/botState");
const { logAction, ACTIONS } = require("../lib/auditLog");

/**
 * Parse duration string to milliseconds
 * Supports: 30s, 5m, 1h, 2h30m, etc.
 */
function parseDuration(str) {
  if (!str) return null;

  let totalMs = 0;
  const regex = /(\d+)\s*(s|m|h|d)/gi;
  let match;

  while ((match = regex.exec(str)) !== null) {
    const value = parseInt(match[1], 10);
    const unit = match[2].toLowerCase();

    switch (unit) {
      case "s":
        totalMs += value * 1000;
        break;
      case "m":
        totalMs += value * 60 * 1000;
        break;
      case "h":
        totalMs += value * 60 * 60 * 1000;
        break;
      case "d":
        totalMs += value * 24 * 60 * 60 * 1000;
        break;
    }
  }

  return totalMs > 0 ? totalMs : null;
}

/**
 * Format milliseconds to human readable
 */
function formatDuration(ms) {
  if (ms <= 0) return "0s";

  const hours = Math.floor(ms / (60 * 60 * 1000));
  const minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
  const seconds = Math.floor((ms % (60 * 1000)) / 1000);

  const parts = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (seconds > 0 && hours === 0) parts.push(`${seconds}s`);

  return parts.join(" ") || "0s";
}

async function silenceCommand(sock, chatId, message, args, ctx) {
  const subCmd = args[0]?.toLowerCase();

  // Show status
  if (!subCmd || subCmd === "status") {
    const info = botState.getSilenceInfo();

    if (!info.enabled) {
      return await sock.sendMessage(chatId, {
        text:
          "🔊 *Silence Mode:* Disabled\n\n" +
          "*Usage:*\nsilence 30m\nsilence 1h\nsilence off",
      });
    }

    const remaining = formatDuration(info.remainingMs);
    return await sock.sendMessage(chatId, {
      text:
        `🔇 *Silence Mode:* Enabled\n⏳ Remaining: ${remaining}\n\n` +
        "Bot only responds to owner.\nNo auto-replies active.",
    });
  }

  // Turn off
  if (subCmd === "off" || subCmd === "disable") {
    if (!botState.isSilenceEnabled()) {
      return await sock.sendMessage(chatId, {
        text: "🔊 Silence mode is already disabled.",
      });
    }

    botState.clearSilence();

    logAction(
      ACTIONS.SILENCE_TOGGLE,
      ctx.senderId,
      ctx.isGroup ? "group" : "private",
      {
        enabled: false,
      },
    );

    return await sock.sendMessage(chatId, {
      text: "🔊 *Silence Mode Disabled*\n\nBot is now responding normally.",
    });
  }

  // Parse duration
  const durationMs = parseDuration(args.join(""));

  if (!durationMs) {
    return await sock.sendMessage(chatId, {
      text:
        "❌ Invalid duration format.\n\n" +
        "*Examples:*\nsilence 30m\nsilence 1h\nsilence 2h30m",
    });
  }

  // Max 24 hours
  if (durationMs > 24 * 60 * 60 * 1000) {
    return await sock.sendMessage(chatId, {
      text: "❌ Maximum silence duration is 24 hours.",
    });
  }

  botState.setSilence(durationMs, ctx.senderId);

  logAction(
    ACTIONS.SILENCE_TOGGLE,
    ctx.senderId,
    ctx.isGroup ? "group" : "private",
    {
      enabled: true,
      durationMs,
    },
  );

  await sock.sendMessage(chatId, {
    text:
      `🔇 *Silence Mode Enabled*\n\n` +
      `⏳ Duration: ${formatDuration(durationMs)}\n\n` +
      "• Bot only responds to owner\n" +
      "• No auto-replies\n" +
      "• Will auto-expire after duration",
  });
}

// Command metadata
silenceCommand.meta = {
  name: "silence",
  aliases: ["quiet", "mute"],
  ownerOnly: true,
  adminOnly: false,
  groupOnly: false,
  lockdownBlocked: false,
  ratelimited: false,
  silenceBlocked: false, // Owner can manage silence during silence
  description: "Temporary quiet mode",
};

module.exports = silenceCommand;
