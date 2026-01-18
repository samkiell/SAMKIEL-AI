/**
 * News Command - Real-time news headlines
 * Multiple fallback APIs for reliability
 * No branding, rate limited
 */

const axios = require("axios");
const { sendText } = require("../lib/sendResponse");

const TIMEOUT = 10000;

/**
 * API 1: Saurav NewsAPI Mirror (Primary - No Key Required)
 */
async function getSauravNews(category, country) {
  const url = `https://saurav.tech/NewsAPI/top-headlines/category/${category}/${country}.json`;
  const { data } = await axios.get(url, { timeout: TIMEOUT });

  if (!data.articles || data.articles.length === 0) {
    throw new Error("No articles found");
  }

  return data.articles.map((a) => ({
    title: a.title,
    description: a.description,
    source: a.source?.name,
    url: a.url,
    publishedAt: a.publishedAt,
  }));
}

/**
 * API 2: GNews (Fallback - Free Tier)
 */
async function getGNews(query) {
  const apiKey = "c08d83b18ca59a6f13a0a950f87fbc59"; // Free tier key
  const url = `https://gnews.io/api/v4/top-headlines?category=${query}&lang=en&country=us&max=5&apikey=${apiKey}`;

  const { data } = await axios.get(url, { timeout: TIMEOUT });

  if (!data.articles || data.articles.length === 0) {
    throw new Error("No articles found");
  }

  return data.articles.map((a) => ({
    title: a.title,
    description: a.description,
    source: a.source?.name,
    url: a.url,
    publishedAt: a.publishedAt,
  }));
}

/**
 * API 3: NewsData.io (Fallback - Free Tier)
 */
async function getNewsData(category) {
  const apiKey = "pub_640511718ca8e60ba5ebf99f4ce7b25d6d23c"; // Free tier
  const url = `https://newsdata.io/api/1/news?apikey=${apiKey}&category=${category}&language=en&country=us`;

  const { data } = await axios.get(url, { timeout: TIMEOUT });

  if (!data.results || data.results.length === 0) {
    throw new Error("No articles found");
  }

  return data.results.slice(0, 5).map((a) => ({
    title: a.title,
    description: a.description,
    source: a.source_id,
    url: a.link,
    publishedAt: a.pubDate,
  }));
}

/**
 * Category mappings
 */
const categoryMap = {
  tech: "technology",
  technology: "technology",
  sports: "sports",
  sport: "sports",
  business: "business",
  finance: "business",
  health: "health",
  science: "science",
  entertainment: "entertainment",
  general: "general",
  world: "general",
  nigeria: { country: "ng", category: "general" },
  ng: { country: "ng", category: "general" },
  india: { country: "in", category: "general" },
  uk: { country: "gb", category: "general" },
  gb: { country: "gb", category: "general" },
};

const categoryEmojis = {
  technology: "💻",
  sports: "⚽",
  business: "💹",
  health: "🏥",
  science: "🔬",
  entertainment: "🎬",
  general: "🌍",
};

async function newsCommand(sock, chatId, message, args = []) {
  const query = args[0]?.toLowerCase() || "general";

  let category = "general";
  let country = "us";
  let emoji = "📰";
  let titleHeader = "Global Headlines";

  // Parse query
  const mapped = categoryMap[query];
  if (typeof mapped === "object") {
    category = mapped.category;
    country = mapped.country;
    titleHeader = `${query.toUpperCase()} News`;
  } else if (mapped) {
    category = mapped;
    titleHeader = `${category.charAt(0).toUpperCase() + category.slice(1)} News`;
  } else {
    // Try as country code
    if (query.length === 2) {
      country = query;
      titleHeader = `${query.toUpperCase()} News`;
    }
  }

  emoji = categoryEmojis[category] || "📰";

  let articles = null;
  let apiUsed = "";

  // Try Saurav Mirror first
  try {
    articles = await getSauravNews(category, country);
    apiUsed = "Saurav";
  } catch (e) {
    console.log("News: Saurav failed, trying GNews...");
  }

  // Try GNews
  if (!articles) {
    try {
      articles = await getGNews(category);
      apiUsed = "GNews";
    } catch (e) {
      console.log("News: GNews failed, trying NewsData...");
    }
  }

  // Try NewsData.io
  if (!articles) {
    try {
      articles = await getNewsData(category);
      apiUsed = "NewsData";
    } catch (e) {
      console.log("News: All APIs failed");
    }
  }

  if (!articles || articles.length === 0) {
    return await sendText(
      sock,
      chatId,
      "❌ Could not fetch news at the moment. Try again later.",
      { quoted: message },
    );
  }

  // Build response
  let response = `${emoji} *${titleHeader}*\n\n`;

  articles.slice(0, 5).forEach((article, index) => {
    const title = article.title || "No Title";
    const desc = article.description
      ? article.description.slice(0, 100) + "..."
      : "";
    const source = article.source || "News";

    response += `${index + 1}. *${title}*\n`;
    if (desc) response += `${desc}\n`;
    response += `_— ${source}_\n\n`;
  });

  await sendText(sock, chatId, response.trim(), { quoted: message });
}

// Command metadata
newsCommand.meta = {
  name: "news",
  aliases: ["headlines", "breaking"],
  ownerOnly: false,
  adminOnly: false,
  groupOnly: false,
  lockdownBlocked: true,
  ratelimited: true,
  silenceBlocked: true,
  description: "Get latest news headlines",
};

module.exports = newsCommand;
