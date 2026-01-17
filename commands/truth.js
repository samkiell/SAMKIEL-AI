const axios = require("axios");
const { sendText } = require("../lib/sendResponse");

async function truthCommand(sock, chatId) {
  try {
    const res = await axios.get("https://api.truthordarebot.xyz/v1/truth");
    const truthMessage = res.data.question;

    await sendText(sock, chatId, `🤔 *Truth:* ${truthMessage}`);
  } catch (error) {
    console.error("Error in truth command:", error);
    await sendText(
      sock,
      chatId,
      "❌ Failed to get truth. Please try again later!",
    );
  }
}

module.exports = { truthCommand };
