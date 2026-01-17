const axios = require("axios");
const { sendText } = require("../lib/sendResponse");

async function dareCommand(sock, chatId) {
  try {
    const res = await axios.get("https://api.truthordarebot.xyz/v1/dare");
    const dareMessage = res.data.question;

    await sendText(sock, chatId, `🎯 *Dare:* ${dareMessage}`);
  } catch (error) {
    console.error("Error in dare command:", error);
    await sendText(
      sock,
      chatId,
      "❌ Failed to get dare. Please try again later!",
    );
  }
}

module.exports = { dareCommand };
