const fetch = require("node-fetch");

async function flirtCommand(sock, chatId) {
  try {
    const shizokeys = "𝕊𝔸𝕄𝕂𝕀𝔼𝕃 𝔹𝕆𝕋";
    const res = await fetch(
      `https://api.shizo.top/api/quote/flirt?apikey=${shizokeys}`
    );

    if (!res.ok) {
      throw await res.text();
    }

    const json = await res.json();
    const flirtMessage = json.result;

    // Send the flirt message
    await sock.sendMessage(chatId, {
      text: flirtMessage,
      ...global.channelInfo,
    });
  } catch (error) {
    console.error("Error in flirt command:", error);
    await sock.sendMessage(chatId, {
      text: "❌ Failed to get flirt message. Please try again later!",
      ...global.channelInfo,
    });
  }
}

module.exports = { flirtCommand };
