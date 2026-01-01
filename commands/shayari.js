const fetch = require("node-fetch");

async function shayariCommand(sock, chatId) {
  try {
    const response = await fetch(
      "https://api.shizo.top/api/quote/shayari?apikey=𝕊𝔸𝕄𝕂𝕀𝔼𝕃 𝔹𝕆𝕋"
    );
    const data = await response.json();

    if (!data || !data.result) {
      throw new Error("Invalid response from API");
    }

    const buttons = [
      {
        buttonId: ".shayari",
        buttonText: { displayText: "Shayari 🪄" },
        type: 1,
      },
      {
        buttonId: ".roseday",
        buttonText: { displayText: "🌹 RoseDay" },
        type: 1,
      },
    ];

    await sock.sendMessage(chatId, {
      text: data.result,
      buttons: buttons,
      headerType: 1,
      ...global.channelInfo,
    });
  } catch (error) {
    console.error("Error in shayari command:", error);
    await sock.sendMessage(chatId, {
      text: "❌ Failed to fetch shayari. Please try again later.",
      ...global.channelInfo,
    });
  }
}

module.exports = { shayariCommand };
