/**
 * Permission Middleware System
 * Centralized permission checks for all commands
 * Implements the middleware pipeline architecture
 */

const { isOwner } = require("./owner");
const botState = require("./botState");

/**
 * Command Permission Matrix
 * Each command registers its permissions here
 */
const commandPermissions = {};

/**
 * Register a command with its permissions
 * @param {object} config - Command configuration
 */
function registerCommand(config) {
  const defaults = {
    name: "",
    aliases: [],
    ownerOnly: false,
    adminOnly: false,
    groupOnly: false,
    privateOnly: false,
    privateAllowed: true,
    lockdownBlocked: false,
    ratelimited: true,
    silenceBlocked: true,
    description: "",
  };

  const cmd = { ...defaults, ...config };
  commandPermissions[cmd.name.toLowerCase()] = cmd;

  // Also register aliases
  cmd.aliases.forEach((alias) => {
    commandPermissions[alias.toLowerCase()] = cmd;
  });
}

/**
 * Get command configuration
 */
function getCommandConfig(commandName) {
  return commandPermissions[commandName.toLowerCase()] || null;
}

/**
 * Build command context object
 * This standardizes what every command receives
 */
async function buildContext(sock, message, chatId, senderId, isGroup) {
  const ownerStatus = await isOwner(senderId);

  // Get group admin status if in group
  let isAdmin = false;
  if (isGroup) {
    try {
      const groupMeta = await sock.groupMetadata(chatId);
      const participant = groupMeta.participants.find(
        (p) =>
          p.id === senderId || p.id.split("@")[0] === senderId.split("@")[0],
      );
      isAdmin =
        participant?.admin === "admin" || participant?.admin === "superadmin";
    } catch (e) {
      // Silently fail
    }
  }

  return {
    sock,
    message,
    chatId,
    senderId,
    isGroup,
    isOwner: ownerStatus,
    isAdmin: ownerStatus || isAdmin, // Owner is always admin
    timestamp: Date.now(),
  };
}

/**
 * MIDDLEWARE: Check if command should proceed
 * Returns { allowed: boolean, reason: string }
 */
async function checkPermissions(ctx, commandName) {
  const config = getCommandConfig(commandName);

  // Unknown command - allow (might be handled elsewhere)
  if (!config) {
    return { allowed: true, reason: null };
  }

  // =====================
  // OWNER BYPASS (First check - owner bypasses ALL)
  // =====================
  if (ctx.isOwner) {
    return { allowed: true, reason: "owner_bypass" };
  }

  // =====================
  // OWNER ONLY CHECK
  // =====================
  if (config.ownerOnly) {
    return { allowed: false, reason: "owner_only", silent: true };
  }

  // =====================
  // FAILSAFE CHECK
  // =====================
  if (botState.isFailsafeTriggered()) {
    return { allowed: false, reason: "failsafe_active", silent: true };
  }

  // =====================
  // SILENCE CHECK
  // =====================
  if (config.silenceBlocked && botState.isSilenceEnabled()) {
    return { allowed: false, reason: "silence_active", silent: true };
  }

  // =====================
  // LOCKDOWN CHECK
  // =====================
  if (config.lockdownBlocked && botState.isLockdownEnabled()) {
    return { allowed: false, reason: "lockdown_active", silent: true };
  }

  // =====================
  // ADMIN ONLY CHECK
  // =====================
  if (config.adminOnly && !ctx.isAdmin) {
    return { allowed: false, reason: "admin_only", silent: true };
  }

  // =====================
  // GROUP ONLY CHECK
  // =====================
  if (config.groupOnly && !ctx.isGroup) {
    return { allowed: false, reason: "group_only", silent: false };
  }

  // =====================
  // PRIVATE ONLY CHECK
  // =====================
  if (config.privateOnly && ctx.isGroup) {
    return { allowed: false, reason: "private_only", silent: false };
  }

  // =====================
  // RATELIMIT CHECK
  // =====================
  if (config.ratelimited && botState.isRatelimitEnabled()) {
    // Exempt admins if configured
    const rlConfig = botState.getRatelimitConfig();
    if (!rlConfig.exemptAdmins || !ctx.isAdmin) {
      if (botState.checkRatelimit(ctx.senderId)) {
        return { allowed: false, reason: "ratelimited", silent: false };
      }
    }
  }

  // All checks passed
  return { allowed: true, reason: null };
}

/**
 * Get human-readable error for permission denial
 */
function getPermissionError(reason) {
  const messages = {
    owner_only: null, // Silent
    failsafe_active: null, // Silent
    silence_active: null, // Silent
    lockdown_active: null, // Silent
    admin_only: null, // Silent
    group_only: "⚠️ This command can only be used in groups.",
    private_only: "⚠️ This command can only be used in private chat.",
    ratelimited: "⏳ Slow down! You're sending commands too fast.",
  };
  return messages[reason] || null;
}

/**
 * Bulk register commands
 */
function registerCommands(commands) {
  commands.forEach((cmd) => registerCommand(cmd));
}

/**
 * Get all registered commands
 */
function getAllCommands() {
  // Get unique commands (not aliases)
  const unique = {};
  Object.values(commandPermissions).forEach((cmd) => {
    unique[cmd.name] = cmd;
  });
  return Object.values(unique);
}

module.exports = {
  registerCommand,
  registerCommands,
  getCommandConfig,
  buildContext,
  checkPermissions,
  getPermissionError,
  getAllCommands,
  commandPermissions,
};
