const axios = require("axios");
const { sendText } = require("../lib/sendResponse");

module.exports = async function (sock, chatId) {
  try {
    const response = await axios.get("https://nekos.life/api/v2/fact");
    const fact = response.data.fact;
    await sendText(sock, chatId, `💡 *Did you know?*\n\n${fact}`);
  } catch (error) {
    console.error("Error fetching fact:", error);
    await sendText(sock, chatId, "Sorry, I could not fetch a fact right now.");
  }
};
