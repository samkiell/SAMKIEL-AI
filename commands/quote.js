const fetch = require("node-fetch");

module.exports = async function quoteCommand(sock, chatId) {
  try {
    const shizokeys = "𝕊𝔸𝕄𝕂𝕀𝔼𝕃 𝔹𝕆𝕋";
    const res = await fetch(
      `https://api.shizo.top/api/quote/quotes?apikey=${shizokeys}`
    );

    if (!res.ok) {
      throw await res.text();
    }

    const json = await res.json();
    const quoteMessage = json.result;

    // Send the quote message
    await sock.sendMessage(chatId, {
      text: quoteMessage,
      ...global.channelInfo,
    });
  } catch (error) {
    console.error("Error in quote command:", error);
    await sock.sendMessage(chatId, {
      text: "❌ Failed to get quote. Please try again later!",
      ...global.channelInfo,
    });
  }
};
