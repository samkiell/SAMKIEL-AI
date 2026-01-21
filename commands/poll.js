const { sendText } = require("../lib/sendResponse");

const { loadPrefix } = require("../lib/prefix");
const { sendReaction } = require("../lib/reactions");

async function pollCommand(sock, chatId, message, args) {
  const currentPrefix = loadPrefix();
  const p = currentPrefix === "off" ? "" : currentPrefix;
  const rawText = args.join(" ");

  if (!rawText.includes("|")) {
    return await sendText(
      sock,
      chatId,
      `📊 *Create Poll*\n\nUsage: ${p}poll Question | Option1 | Option2 | ...\nExample: ${p}poll Favorite Color? | Red | Blue | Green\n\n*Powered by SAMKIEL BOT*`,
    );
  }

  const parts = rawText
    .split("|")
    .map((p) => p.trim())
    .filter((p) => p);

  if (parts.length < 3) {
    return await sendText(
      sock,
      chatId,
      "❌ You must provide a question and at least 2 options.\n\n*Powered by SAMKIEL BOT*",
    );
  }

  // Adding reaction for feedback
  await sendReaction(sock, message, "⏳");

  const name = parts[0];
  const rawValues = parts.slice(1);
  const values = [...new Set(rawValues)]; // Ensure unique options

  if (values.length < 2) {
    return await sendText(
      sock,
      chatId,
      "❌ You must provide at least 2 UNIQUE options.\n\n*Powered by SAMKIEL BOT*",
    );
  }

  if (values.length > 12) {
    return await sendText(
      sock,
      chatId,
      "❌ A poll cannot have more than 12 options.\n\n*Powered by SAMKIEL BOT*",
    );
  }

  try {
    console.log(
      `[POLL] Creating poll: "${name}" with ${values.length} options`,
    );
    await sock.sendMessage(chatId, {
      poll: {
        name: name,
        values: values,
        selectableCount: 1,
      },
    });
  } catch (error) {
    console.error("Poll Error:", error);
    await sendText(
      sock,
      chatId,
      "❌ Failed to create poll. Error: " +
        (error.message || "Unknown error") +
        "\n\n*Powered by SAMKIEL BOT*",
    );
  }
}

module.exports = { pollCommand };
