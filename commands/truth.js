const fetch = require("node-fetch");

async function truthCommand(sock, chatId) {
  try {
    const shizokeys = "𝕊𝔸𝕄𝕂𝕀𝔼𝕃 𝔹𝕆𝕋";
    const res = await fetch(
      `https://api.shizo.top/api/quote/truth?apikey=${shizokeys}`
    );

    if (!res.ok) {
      throw await res.text();
    }

    const json = await res.json();
    const truthMessage = json.result;

    // Send the truth message
    await sock.sendMessage(chatId, {
      text: truthMessage,
      ...global.channelInfo,
    });
  } catch (error) {
    console.error("Error in truth command:", error);
    await sock.sendMessage(chatId, {
      text: "❌ Failed to get truth. Please try again later!",
      ...global.channelInfo,
    });
  }
}

module.exports = { truthCommand };
