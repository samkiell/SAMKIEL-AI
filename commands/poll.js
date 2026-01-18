const { sendText } = require("../lib/sendResponse");

async function pollCommand(sock, chatId, message, args) {
  const rawText = args.join(" ");

  if (!rawText.includes("|")) {
    return await sendText(
      sock,
      chatId,
      "📊 *Create Poll*\n\nUsage: .poll Question | Option1 | Option2 | ...\nExample: .poll Favorite Color? | Red | Blue | Green",
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
      "❌ You must provide a question and at least 2 options.",
    );
  }

  const name = parts[0];
  const values = parts.slice(1);

  try {
    await sock.sendMessage(chatId, {
      poll: {
        name: name,
        values: values,
        selectableCount: 1,
      },
    });
  } catch (error) {
    console.error("Poll Error:", error);
    await sendText(sock, chatId, "❌ Failed to create poll.");
  }
}

module.exports = { pollCommand };
