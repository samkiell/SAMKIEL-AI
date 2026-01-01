const fetch = require("node-fetch");

async function dareCommand(sock, chatId) {
  try {
    const shizokeys = "𝕊𝔸𝕄𝕂𝕀𝔼𝕃 𝔹𝕆𝕋";
    const res = await fetch(
      `https://api.shizo.top/api/quote/dare?apikey=${shizokeys}`
    );

    if (!res.ok) {
      throw await res.text();
    }

    const json = await res.json();
    const dareMessage = json.result;

    // Send the dare message
    await sock.sendMessage(chatId, {
      text: dareMessage,
      ...global.channelInfo,
    });
  } catch (error) {
    console.error("Error in dare command:", error);
    await sock.sendMessage(chatId, {
      text: "❌ Failed to get dare. Please try again later!",
      ...global.channelInfo,
    });
  }
}

module.exports = { dareCommand };
