const axios = require("axios");

async function memeCommand(sock, chatId) {
  try {
    const response = await axios.get("https://meme-api.com/gimme");
    const data = response.data;

    if (!data || !data.url) {
      throw new Error("Invalid response from API");
    }

    await sock.sendMessage(chatId, {
      image: { url: data.url },
      caption: `*${data.title}*\n\n> Source: r/${data.subreddit}`,
      contextInfo: global.channelInfo?.contextInfo || {},
    });
  } catch (error) {
    console.error("Error in meme command:", error);
    await sock.sendMessage(chatId, {
      text: "❌ Failed to fetch meme. Please try again later.",
      contextInfo: global.channelInfo?.contextInfo || {},
    });
  }
}

module.exports = memeCommand;
