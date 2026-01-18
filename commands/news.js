const axios = require("axios");
const { sendText } = require("../lib/sendResponse");

// Mirror of NewsAPI that is Keyless and Reliable
// Supported countries: us, ng, in, gb, ca, au, za, etc.
// Supported categories: business, entertainment, general, health, science, sports, technology
const BASE_URL = "https://saurav.tech/NewsAPI";

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

module.exports = async function (sock, chatId, message, args = []) {
  try {
    let url = "";
    let titleHeader = "📰 *Latest News*";

    const subcmd = args[0]?.toLowerCase();

    if (!subcmd || subcmd === "all" || subcmd === "global") {
      // Default: Top Headlines from US (General)
      url = `${BASE_URL}/top-headlines/category/general/us.json`;
      titleHeader = "🌎 *Global Headlines*";
    } else if (subcmd === "nigeria" || subcmd === "ng") {
      url = `${BASE_URL}/top-headlines/category/general/ng.json`;
      titleHeader = "🇳🇬 *Nigeria Top News*";
    } else if (subcmd === "india" || subcmd === "in") {
      url = `${BASE_URL}/top-headlines/category/general/in.json`;
      titleHeader = "🇮🇳 *India Top News*";
    } else if (subcmd === "tech" || subcmd === "technology") {
      url = `${BASE_URL}/top-headlines/category/technology/us.json`;
      titleHeader = "💻 *Technology News*";
    } else if (subcmd === "sports") {
      url = `${BASE_URL}/top-headlines/category/sports/us.json`;
      titleHeader = "⚽ *Sports Highlights*";
    } else if (subcmd === "business") {
      url = `${BASE_URL}/top-headlines/category/business/us.json`;
      titleHeader = "💹 *Business News*";
    } else if (subcmd === "health") {
      url = `${BASE_URL}/top-headlines/category/health/us.json`;
      titleHeader = "🏥 *Health & Wellness News*";
    } else if (subcmd === "country") {
      const countryInput = args[1]?.toLowerCase();
      const code = countryCodes[countryInput] || countryInput || "us";
      url = `${BASE_URL}/top-headlines/category/general/${code}.json`;
      titleHeader = `📰 *Top News: ${code.toUpperCase()}*`;
    } else {
      // If none of the specific subcmds match, try treating it as a country code or category
      if (countryCodes[subcmd]) {
        const code = countryCodes[subcmd];
        url = `${BASE_URL}/top-headlines/category/general/${code}.json`;
        titleHeader = `📰 *News: ${subcmd.toUpperCase()}*`;
      } else {
        // Fallback to US general news if query is unknown
        url = `${BASE_URL}/top-headlines/category/general/us.json`;
        titleHeader = "🌎 *Global Headlines*";
      }
    }

    const response = await axios.get(url);
    const articles = response.data.articles || [];

    if (articles.length === 0) {
      return await sendText(sock, chatId, "❌ No news found at the moment.");
    }

    // Limit to 5 articles for clarity
    const displayArticles = articles.slice(0, 5);

    let newsMessage = `${titleHeader}\n\n`;
    displayArticles.forEach((article, index) => {
      const title = article.title || "No Title";
      const description = article.description
        ? article.description.slice(0, 120) + "..."
        : "Tap to read full article.";

      newsMessage += `${index + 1}. *${title}*\n${description}\n\n`;
    });

    newsMessage += `_Source: News Aggregator_`;

    await sendText(sock, chatId, newsMessage, { quoted: message });
  } catch (error) {
    console.error("News Command Error:", error.message);
    await sendText(
      sock,
      chatId,
      "❌ Failed to fetch news. The mirror might be down or the query is invalid.",
      { quoted: message },
    );
  }
};
