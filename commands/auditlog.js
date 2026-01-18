/**
 * Audit Log Command
 * View critical bot action history
 * Owner only, no branding
 */

const { getRecentLogs, getLogStats } = require("../lib/auditLog");

async function auditlogCommand(sock, chatId, message, args, ctx) {
  // Get count from args (default 5)
  let count = 5;
  if (args[0]) {
    const parsed = parseInt(args[0], 10);
    if (!isNaN(parsed) && parsed > 0 && parsed <= 50) {
      count = parsed;
    }
  }

  const logs = getRecentLogs(count);

  if (logs.length === 0) {
    return await sock.sendMessage(chatId, {
      text: "📋 No audit log entries found.",
    });
  }

  // Format output
  let output = `📋 *Audit Log* (Last ${logs.length} entries)\n\n`;

  logs.forEach((entry, idx) => {
    const time = new Date(entry.timestamp).toLocaleString();
    const executor = entry.executor?.split("@")[0] || "System";
    const details = entry.details ? ` → ${JSON.stringify(entry.details)}` : "";

    output += `${idx + 1}. *${entry.action}*\n`;
    output += `   📅 ${time}\n`;
    output += `   👤 ${executor}\n`;
    output += `   📍 ${entry.context}${details}\n\n`;
  });

  // Add stats
  const stats = getLogStats();
  output += `─────────────────\n`;
  output += `Total Entries: ${stats.totalEntries}`;

  await sock.sendMessage(chatId, { text: output });
}

// Command metadata for registration
auditlogCommand.meta = {
  name: "auditlog",
  aliases: ["audit", "logs"],
  ownerOnly: true,
  adminOnly: false,
  groupOnly: false,
  lockdownBlocked: false,
  ratelimited: false,
  silenceBlocked: false,
  description: "View bot action audit log",
};

module.exports = auditlogCommand;
