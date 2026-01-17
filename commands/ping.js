const { performance } = require("perf_hooks");
const { sendText, editMessage, sendEditable } = require("../lib/sendResponse");

/**
 * Ping Command
 *
 * Shows bot response latency.
 * Output format: Just the ping value, e.g., "92 ms" or "147 ms"
 * - NO decimals
 * - NO additional text unless explicitly requested
 * - NO branding (utility command)
 */
async function pingCommand(sock, chatId, message) {
  try {
    const start = performance.now();

    // Send initial pinging message
    const initialMsg = await sendEditable(sock, chatId, "⚡ Pinging...", {
      withBranding: false,
      quoted: message,
    });
    const key = initialMsg.key;

    // Brief loader animation (faster than before)
    const loaders = ["▪️▪️▪️", "🟩▪️▪️", "🟩🟩▪️", "🟩🟩🟩"];

    for (const loader of loaders) {
      await new Promise((r) => setTimeout(r, 100));
      await editMessage(sock, chatId, key, `⚡ ${loader}`, {
        withBranding: false,
      });
    }

    // Calculate final ping - ROUNDED, NO DECIMALS
    const end = performance.now();
    const ping = Math.round(end - start);

    // Final output: Clean, minimal
    const finalMessage = `${ping} ms`;

    await editMessage(sock, chatId, key, finalMessage, {
      withBranding: false,
    });
  } catch (error) {
    console.error("Error in ping command:", error);
    await sendText(sock, chatId, "❌ Failed to calculate ping.", {
      withBranding: false,
      quoted: message,
    });
  }
}

module.exports = pingCommand;
