const axios = require("axios");
const { sendText } = require("../lib/sendResponse");

async function bibleCommand(sock, chatId, args) {
  if (!args || args.length === 0) {
    return await sendText(
      sock,
      chatId,
      "🔍 Please provide a book and verse.\nExample: *.bible john 3:16* or *.bible john 4 26*",
    );
  }

  let query = args.join(" ").trim();

  // Smart pattern fix: matches end of string like "3 16" or "3 16-18"
  // This allows queries like "john 4 26" to work by converting to "john 4:26"
  const regex = /(\d+)\s+(\d+)(?:-(\d+))?$/;
  if (regex.test(query) && !query.includes(":")) {
    query = query.replace(regex, (match, ch, vStart, vEnd) => {
      return `${ch}:${vStart}${vEnd ? "-" + vEnd : ""}`;
    });
  }

  try {
    // Show typing state
    await sock.sendPresenceUpdate("composing", chatId);

    const response = await axios.get(
      `https://bible-api.com/${encodeURIComponent(query)}`,
      { timeout: 10000 },
    );
    const data = response.data;

    if (!data || !data.text) {
      throw new Error("Verse not found");
    }

    const { reference, text, translation_name } = data;
    const formattedBible = `📖 *${reference}*\n\n${text.trim()}\n\n_— ${translation_name}_`;

    await sendText(sock, chatId, formattedBible);
  } catch (error) {
    console.error("Bible API Error:", error.message);
    if (error.response?.status === 404) {
      await sendText(
        sock,
        chatId,
        "❌ Reference not found. Try adding a colon (e.g., 3:16) or check the book name.",
      );
    } else {
      await sendText(
        sock,
        chatId,
        "❌ Failed to fetch. Make sure the reference exists (e.g., John 3:16).",
      );
    }
  }
}

module.exports = bibleCommand;
