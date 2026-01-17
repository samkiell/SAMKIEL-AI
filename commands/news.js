const axios = require("axios");
const { sendText } = require("../lib/sendResponse");

// Mapping for country codes to NewsAPI (2-letter codes)
const countryCodes = {
  us: "us",
  nigeria: "ng",
  ng: "ng",
  india: "in",
  in: "in",
  uk: "gb",
  gb: "gb",
  canada: "ca",
  ca: "ca",
  australia: "au",
  au: "au",
  southafrica: "za",
  za: "za",
};

// Simple News API keys (using fallback method if one fails)
const API_KEYS = [
  "f1873099ed504938a9ca2ce200922881", // Replace with a more robust management if needed
];

module.exports = async function (sock, chatId, message, args = []) {
  try {
    let url = "";
    let titleHeader = "📰 *Latest Global News*";
    const apiKey = API_KEYS[0];

    const subcmd = args[0]?.toLowerCase();

    if (!subcmd || subcmd === "all" || subcmd === "global") {
      // Use Spaceflight News as default for "all" (Keyless & Reliable)
      url = "https://api.spaceflightnewsapi.net/v4/articles/?limit=5";
      titleHeader = "🚀 *Global Space & Tech News*";

      const response = await axios.get(url);
      const articles = response.data.results;
      let newsMessage = `${titleHeader}:\n\n`;
      articles.forEach((article, index) => {
        newsMessage += `${index + 1}. *${article.title}*\n${article.summary.slice(0, 100)}...\n🔗 ${article.url}\n\n`;
      });
      return await sendText(sock, chatId, newsMessage);
    } else if (subcmd === "country") {
      const countryInput = args[1]?.toLowerCase();
      const code = countryCodes[countryInput] || countryInput || "us";
      url = `https://newsapi.org/v2/top-headlines?country=${code}&apiKey=${apiKey}&pageSize=5`;
      titleHeader = `📰 *Top News in ${code.toUpperCase()}*`;
    } else if (subcmd === "category") {
      const category = args[1]?.toLowerCase() || "technology";
      url = `https://newsapi.org/v2/top-headlines?category=${category}&language=en&apiKey=${apiKey}&pageSize=5`;
      titleHeader = `📰 *Top ${category.charAt(0).toUpperCase() + category.slice(1)} News*`;
    } else if (subcmd === "tech" || subcmd === "technology") {
      url = `https://newsapi.org/v2/top-headlines?category=technology&language=en&apiKey=${apiKey}&pageSize=5`;
      titleHeader = "💻 *Technology News*";
    } else if (subcmd === "ai" || subcmd === "artificial") {
      url = `https://newsapi.org/v2/everything?q=Artificial%20Intelligence&language=en&sortBy=publishedAt&apiKey=${apiKey}&pageSize=5`;
      titleHeader = "🤖 *AI & Future Tech News*";
    } else {
      // Search query
      const query = args.join(" ");
      url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&language=en&sortBy=relevancy&apiKey=${apiKey}&pageSize=5`;
      titleHeader = `🔍 *News Search: ${query}*`;
    }

    const response = await axios.get(url);
    const articles = response.data.articles || [];

    if (articles.length === 0) {
      return await sendText(sock, chatId, "❌ No news found for that query.");
    }

    let newsMessage = `${titleHeader}:\n\n`;
    articles.forEach((article, index) => {
      newsMessage += `${index + 1}. *${article.title}*\n${article.description ? article.description.slice(0, 100) + "..." : "No summary available."}\n🔗 ${article.url}\n\n`;
    });

    await sendText(sock, chatId, newsMessage);
  } catch (error) {
    console.error("Error fetching news:", error.message);
    if (error.response?.status === 401) {
      await sendText(sock, chatId, "❌ News API Key is invalid or expired.");
    } else {
      await sendText(
        sock,
        chatId,
        "❌ Failed to fetch news. Please try again later.",
      );
    }
  }
};
