/**
 * Failsafe Command
 * Manage crash protection
 * Owner only, no branding
 */

const botState = require("../lib/botState");
const { logAction, ACTIONS } = require("../lib/auditLog");

async function failsafeCommand(sock, chatId, message, args, ctx) {
  const subCmd = args[0]?.toLowerCase();

  const info = botState.getFailsafeInfo();

  // Show status if no args
  if (!subCmd) {
    let status;
    if (info.triggered) {
      status = "⚠️ TRIGGERED - Bot in emergency private mode";
    } else if (info.crashCount > 0) {
      status = `⚡ Active - ${info.crashCount}/${info.threshold} crashes logged`;
    } else {
      status = "✅ Normal - No recent crashes";
    }

    let msg = `🛡️ *Failsafe Status*\n\n${status}\n\n`;
    msg += `*Configuration:*\n`;
    msg += `├ Threshold: ${info.threshold} crashes\n`;
    msg += `├ Window: ${info.windowMs / 1000}s\n`;
    msg += `└ Crash Count: ${info.crashCount}\n\n`;

    if (info.lastCrashAt) {
      const lastCrash = new Date(info.lastCrashAt).toLocaleString();
      msg += `📅 Last Crash: ${lastCrash}\n\n`;
    }

    msg += `*Commands:*\nfailsafe reset\nfailsafe test`;

    return await sock.sendMessage(chatId, { text: msg });
  }

  // Reset failsafe
  if (subCmd === "reset" || subCmd === "clear") {
    botState.resetFailsafe();

    logAction(
      ACTIONS.FAILSAFE_RESET,
      ctx.senderId,
      ctx.isGroup ? "group" : "private",
      {
        previousCrashCount: info.crashCount,
        wasTriggered: info.triggered,
      },
    );

    return await sock.sendMessage(chatId, {
      text:
        "🛡️ *Failsafe Reset*\n\n" +
        "Crash counter cleared.\n" +
        "Bot restored to normal operation.",
    });
  }

  // Test failsafe (simulate crash)
  if (subCmd === "test") {
    await sock.sendMessage(chatId, {
      text: "🧪 *Simulating Crash*\n\nRecording a crash event...",
    });

    const triggered = botState.recordCrash();
    const newInfo = botState.getFailsafeInfo();

    if (triggered) {
      return await sock.sendMessage(chatId, {
        text:
          "⚠️ *Failsafe Triggered!*\n\n" +
          "Crash threshold exceeded.\n" +
          "Bot would enter private mode in production.\n\n" +
          "Use `failsafe reset` to clear.",
      });
    } else {
      return await sock.sendMessage(chatId, {
        text:
          `🧪 *Crash Recorded*\n\n` +
          `Crash count: ${newInfo.crashCount}/${newInfo.threshold}\n\n` +
          `Failsafe will trigger after ${newInfo.threshold - newInfo.crashCount} more.`,
      });
    }
  }

  await sock.sendMessage(chatId, {
    text: "❌ Unknown subcommand.\n\nUse: failsafe | failsafe reset | failsafe test",
  });
}

// Command metadata
failsafeCommand.meta = {
  name: "failsafe",
  aliases: ["fs", "crash"],
  ownerOnly: true,
  adminOnly: false,
  groupOnly: false,
  lockdownBlocked: false,
  ratelimited: false,
  silenceBlocked: false,
  description: "Manage crash protection",
};

module.exports = failsafeCommand;
