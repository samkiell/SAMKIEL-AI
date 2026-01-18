/**
 * Snapshot Command
 * Instant bot state inspection
 * Admin/Owner allowed, no branding
 */

const os = require("os");
const botState = require("../lib/botState");
const { loadPrefix } = require("../lib/prefix");
const settings = require("../settings");

// Track bot start time
const botStartTime = Date.now();

/**
 * Format uptime
 */
function formatUptime(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours % 24 > 0) parts.push(`${hours % 24}h`);
  if (minutes % 60 > 0) parts.push(`${minutes % 60}m`);
  if (seconds % 60 > 0 && days === 0) parts.push(`${seconds % 60}s`);

  return parts.join(" ") || "0s";
}

/**
 * Format bytes
 */
function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

async function snapshotCommand(sock, chatId, message, args, ctx) {
  // Get all state info
  const lockdown = botState.getLockdownInfo();
  const silence = botState.getSilenceInfo();
  const ratelimit = botState.getRatelimitConfig();
  const failsafe = botState.getFailsafeInfo();

  // Memory usage
  const memUsage = process.memoryUsage();
  const heapUsed = formatBytes(memUsage.heapUsed);
  const heapTotal = formatBytes(memUsage.heapTotal);
  const rss = formatBytes(memUsage.rss);

  // Uptime
  const uptime = formatUptime(Date.now() - botStartTime);

  // Prefix
  let prefix;
  try {
    prefix = loadPrefix() || settings.prefix || ".";
  } catch {
    prefix = ".";
  }

  // Mode
  let mode;
  try {
    mode = settings.featureToggles?.BOT_MODE || "public";
  } catch {
    mode = "public";
  }

  // Build output
  let output = `📸 *Bot Snapshot*\n\n`;

  // Core
  output += `*⚙️ Core*\n`;
  output += `├ Mode: ${mode}\n`;
  output += `├ Prefix: ${prefix}\n`;
  output += `└ Uptime: ${uptime}\n\n`;

  // Security
  output += `*🔐 Security*\n`;
  output += `├ Lockdown: ${lockdown.enabled ? "🔒 ON" : "🔓 OFF"}\n`;
  output += `├ Silence: ${silence.enabled ? "🔇 ON" : "🔊 OFF"}\n`;
  output += `├ Rate Limit: ${ratelimit.enabled ? `⏱️ ${ratelimit.limit}/min` : "OFF"}\n`;
  output += `└ Failsafe: ${failsafe.triggered ? "⚠️ TRIGGERED" : "✅ OK"}\n\n`;

  // Resources
  output += `*💾 Resources*\n`;
  output += `├ Heap: ${heapUsed} / ${heapTotal}\n`;
  output += `├ RSS: ${rss}\n`;
  output += `├ Platform: ${os.platform()}\n`;
  output += `└ Node: ${process.version}\n`;

  // Active states
  if (silence.enabled && silence.remainingMs > 0) {
    output += `\n⏳ Silence expires in: ${formatUptime(silence.remainingMs)}`;
  }

  if (failsafe.crashCount > 0) {
    output += `\n⚠️ Recent crashes: ${failsafe.crashCount}/${failsafe.threshold}`;
  }

  await sock.sendMessage(chatId, { text: output });
}

// Command metadata
snapshotCommand.meta = {
  name: "snapshot",
  aliases: ["status", "botinfo", "state"],
  ownerOnly: false,
  adminOnly: true, // Admins and owner can use
  groupOnly: false,
  lockdownBlocked: false,
  ratelimited: true,
  silenceBlocked: false, // Status should always work
  description: "View bot state snapshot",
};

module.exports = snapshotCommand;
