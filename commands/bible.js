const axios = require("axios");
const { sendText } = require("../lib/sendResponse");

async function bibleCommand(sock, chatId, args) {
  if (!args || args.length === 0) {
    return await sendText(
      sock,
      chatId,
      "🔍 Please provide a book and verse.\nExample: *.bible john 3:16* or *.bible genesis 1:1-5*",
    );
  }

  const query = args.join(" ");
  try {
    // Show a small reaction or status
    // await sock.sendMessage(chatId, { react: { text: "📖", key: message.key } });

    const response = await axios.get(
      `https://bible-api.com/${encodeURIComponent(query)}`,
    );
    const data = response.data;

    if (!data || !data.text) {
      throw new Error("Verse not found");
    }

    const { reference, text, translation_name } = data;
    const formattedBible = `📖 *${reference}*\n\n${text.trim()}\n\n_— ${translation_name}_`;

    await sendText(sock, chatId, formattedBible);
  } catch (error) {
    console.error("Bible API Error:", error);
    if (error.response?.status === 404) {
      await sendText(
        sock,
        chatId,
        "❌ Verse not found. Please check the book name and chapter/verse numbers.",
      );
    } else {
      await sendText(
        sock,
        chatId,
        "❌ Failed to fetch Bible verse. Please try again later.",
      );
    }
  }
}

module.exports = { bibleCommand };
