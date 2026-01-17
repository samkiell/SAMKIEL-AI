const axios = require("axios");
const { sendText } = require("../lib/sendResponse");

async function shayariCommand(sock, chatId) {
  try {
    const response = await axios.get(
      "https://hindi-quotes.vercel.app/api/shayari",
    );
    const data = response.data;

    if (!data || !data.quote) {
      throw new Error("Invalid response from API");
    }

    await sendText(sock, chatId, `🖋️ *Shayari:*\n\n${data.quote}`);
  } catch (error) {
    console.error("Error in shayari command:", error);
    await sendText(
      sock,
      chatId,
      "❌ Failed to fetch shayari. Please try again later.",
    );
  }
}

module.exports = { shayariCommand };
