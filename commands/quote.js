const axios = require("axios");
const { sendText } = require("../lib/sendResponse");

module.exports = async function quoteCommand(sock, chatId) {
  try {
    const res = await axios.get(
      "https://api.forismatic.com/api/1.0/?method=getQuote&format=json&lang=en",
    );
    const { quoteText, quoteAuthor } = res.data;
    const quoteMessage = `“${quoteText.trim()}”\n\n— *${quoteAuthor || "Unknown"}*\n\n*Powered by SAMKIEL BOT*`;

    await sendText(sock, chatId, quoteMessage);
  } catch (error) {
    console.error("Error in quote command:", error);
    await sendText(
      sock,
      chatId,
      "❌ Failed to get quote. Please try again later!",
    );
  }
};
