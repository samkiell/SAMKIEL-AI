/**
 * Ratelimit Command
 * Prevent spam and abuse
 * Owner only, no branding
 */

const botState = require("../lib/botState");
const { logAction, ACTIONS } = require("../lib/auditLog");

/**
 * Parse ratelimit format: "5/1m" or "10/30s"
 */
function parseRatelimit(str) {
  if (!str) return null;

  const regex = /^(\d+)\/(\d+)(s|m|h)$/i;
  const match = str.match(regex);

  if (!match) return null;

  const limit = parseInt(match[1], 10);
  const value = parseInt(match[2], 10);
  const unit = match[3].toLowerCase();

  let windowMs;
  switch (unit) {
    case "s":
      windowMs = value * 1000;
      break;
    case "m":
      windowMs = value * 60 * 1000;
      break;
    case "h":
      windowMs = value * 60 * 60 * 1000;
      break;
    default:
      return null;
  }

  return { limit, windowMs };
}

/**
 * Format window to human readable
 */
function formatWindow(ms) {
  if (ms >= 60 * 60 * 1000) {
    return `${ms / (60 * 60 * 1000)}h`;
  } else if (ms >= 60 * 1000) {
    return `${ms / (60 * 1000)}m`;
  } else {
    return `${ms / 1000}s`;
  }
}

async function ratelimitCommand(sock, chatId, message, args, ctx) {
  const subCmd = args[0]?.toLowerCase();

  // Show status if no args
  if (!subCmd) {
    const config = botState.getRatelimitConfig();

    if (!config.enabled) {
      return await sock.sendMessage(chatId, {
        text:
          "⏱️ *Rate Limiting:* Disabled\n\n" +
          "*Usage:*\nratelimit 5/1m\nratelimit 10/30s\nratelimit off\nratelimit exempt admins|all",
      });
    }

    const window = formatWindow(config.windowMs);
    return await sock.sendMessage(chatId, {
      text:
        `⏱️ *Rate Limiting:* Enabled\n\n` +
        `📊 Limit: ${config.limit} commands per ${window}\n` +
        `👥 Admins Exempt: ${config.exemptAdmins ? "Yes" : "No"}\n\n` +
        "*Commands:*\nratelimit off\nratelimit exempt admins|all",
    });
  }

  // Turn off
  if (subCmd === "off" || subCmd === "disable") {
    if (!botState.isRatelimitEnabled()) {
      return await sock.sendMessage(chatId, {
        text: "⏱️ Rate limiting is already disabled.",
      });
    }

    botState.disableRatelimit();

    logAction(
      ACTIONS.RATELIMIT_CHANGE,
      ctx.senderId,
      ctx.isGroup ? "group" : "private",
      {
        enabled: false,
      },
    );

    return await sock.sendMessage(chatId, {
      text: "⏱️ *Rate Limiting Disabled*",
    });
  }

  // Handle exemption setting
  if (subCmd === "exempt") {
    const mode = args[1]?.toLowerCase();

    if (mode === "admins") {
      const config = botState.getRatelimitConfig();
      botState.setRatelimit(config.limit, config.windowMs, true);

      return await sock.sendMessage(chatId, {
        text: "✅ Admins are now exempt from rate limiting.",
      });
    } else if (mode === "all" || mode === "none") {
      const config = botState.getRatelimitConfig();
      botState.setRatelimit(config.limit, config.windowMs, false);

      return await sock.sendMessage(chatId, {
        text: "✅ Rate limiting applies to everyone (except owner).",
      });
    } else {
      return await sock.sendMessage(chatId, {
        text: "❌ Use: ratelimit exempt admins | ratelimit exempt all",
      });
    }
  }

  // Parse limit format
  const parsed = parseRatelimit(subCmd);

  if (!parsed) {
    return await sock.sendMessage(chatId, {
      text:
        "❌ Invalid format.\n\n" +
        "*Format:* `limit/window`\n" +
        "*Examples:*\nratelimit 5/1m (5 per minute)\nratelimit 10/30s (10 per 30 seconds)",
    });
  }

  // Validate limits
  if (parsed.limit < 1 || parsed.limit > 100) {
    return await sock.sendMessage(chatId, {
      text: "❌ Limit must be between 1 and 100.",
    });
  }

  if (parsed.windowMs < 10000 || parsed.windowMs > 3600000) {
    return await sock.sendMessage(chatId, {
      text: "❌ Window must be between 10s and 1h.",
    });
  }

  const config = botState.getRatelimitConfig();
  botState.setRatelimit(parsed.limit, parsed.windowMs, config.exemptAdmins);

  logAction(
    ACTIONS.RATELIMIT_CHANGE,
    ctx.senderId,
    ctx.isGroup ? "group" : "private",
    {
      enabled: true,
      limit: parsed.limit,
      windowMs: parsed.windowMs,
    },
  );

  const window = formatWindow(parsed.windowMs);
  await sock.sendMessage(chatId, {
    text:
      `⏱️ *Rate Limiting Enabled*\n\n` +
      `📊 Limit: ${parsed.limit} commands per ${window}\n` +
      `👥 Admins Exempt: ${config.exemptAdmins ? "Yes" : "No"}`,
  });
}

// Command metadata
ratelimitCommand.meta = {
  name: "ratelimit",
  aliases: ["rl", "limit"],
  ownerOnly: true,
  adminOnly: false,
  groupOnly: false,
  lockdownBlocked: false,
  ratelimited: false,
  silenceBlocked: false,
  description: "Configure rate limiting",
};

module.exports = ratelimitCommand;
