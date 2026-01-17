const axios = require("axios");
const { sendText } = require("../lib/sendResponse");

module.exports = async function (sock, chatId) {
  try {
    const response = await axios.get(
      "https://api.spaceflightnewsapi.net/v4/articles/?limit=5",
    );
    const articles = response.data.results;

    let newsMessage = "🚀 *Latest Space & Tech News*:\n\n";
    articles.forEach((article, index) => {
      newsMessage += `${index + 1}. *${article.title}*\n${article.summary.slice(0, 150)}...\n🔗 ${article.url}\n\n`;
    });

    await sendText(sock, chatId, newsMessage);
  } catch (error) {
    console.error("Error fetching news:", error);
    await sendText(sock, chatId, "Sorry, I could not fetch news right now.");
  }
};
