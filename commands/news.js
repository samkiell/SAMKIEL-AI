/**
 * News Command - Real-time news headlines
 * Powered by Google News RSS (Primary) & Multiple APIs
 * Supports ALL countries and categories
 */

const axios = require("axios");
const cheerio = require("cheerio");
const { sendText } = require("../lib/sendResponse");

const TIMEOUT = 15000;

// ============================================
// DATA & MAPPINGS
// ============================================

const COUNTRY_MAP = {
  nigeria: "ng",
  ng: "ng",
  usa: "us",
  us: "us",
  america: "us",
  united_states: "us",
  uk: "gb",
  gb: "gb",
  britain: "gb",
  united_kingdom: "gb",
  india: "in",
  in: "in",
  canada: "ca",
  ca: "ca",
  ghana: "gh",
  gh: "gh",
  australia: "au",
  au: "au",
  brazil: "br",
  br: "br",
  france: "fr",
  fr: "fr",
  germany: "de",
  de: "de",
  japan: "jp",
  jp: "jp",
  russia: "ru",
  ru: "ru",
  china: "cn",
  cn: "cn",
  south_africa: "za",
  za: "za",
  kenya: "ke",
  ke: "ke",
  uae: "ae",
  dubai: "ae",
  saudi: "sa",
  sa: "sa",
  egypt: "eg",
  eg: "eg",
  israel: "il",
  il: "il",
};

const CATEGORY_MAP = {
  tech: "technology",
  technology: "technology",
  sport: "sports",
  sports: "sports",
  business: "business",
  finance: "business",
  health: "health",
  science: "science",
  entertainment: "entertainment",
  general: "general",
  world: "general",
  politics: "politics",
};

// ============================================
// API IMPLEMENTATIONS
// ============================================

/**
 * 1. GOOGLE NEWS RSS (Primary - Reliable for all countries)
 */
async function getGoogleNews(query, countryCode) {
  const cc = countryCode.toUpperCase();
  // Construct RSS URL
  // Example: https://news.google.com/rss/search?q=technology+Nigeria&hl=en-NG&gl=NG&ceid=NG:en
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-${cc}&gl=${cc}&ceid=${cc}:en`;

  const { data } = await axios.get(url, {
    timeout: TIMEOUT,
    headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
  });

  const $ = cheerio.load(data, { xmlMode: true });
  const articles = [];

  $("item")
    .slice(0, 5)
    .each((i, el) => {
      const title = $(el).find("title").text();
      const pubDate = $(el).find("pubDate").text();
      const source = $(el).find("source").text() || "Google News";

      articles.push({
        title: title,
        source: source,
        pubDate: pubDate,
      });
    });

  if (articles.length === 0) throw new Error("No Google RSS items");
  return articles;
}

/**
 * 2. NewsData.io (Fallback)
 */
async function getNewsData(category, country) {
  const apiKey = "pub_640511718ca8e60ba5ebf99f4ce7b25d6d23c";
  let url = `https://newsdata.io/api/1/news?apikey=${apiKey}&language=en`;

  if (country) url += `&country=${country}`;
  if (category && category !== "general") url += `&category=${category}`;

  const { data } = await axios.get(url, { timeout: TIMEOUT });
  if (!data.results || data.results.length === 0)
    throw new Error("No articles");

  return data.results.map((a) => ({
    title: a.title,
    source: a.source_id,
    pubDate: a.pubDate,
  }));
}

/**
 * 3. GNews (Fallback)
 */
async function getGNews(category, country) {
  const apiKey = "c08d83b18ca59a6f13a0a950f87fbc59";
  const url = `https://gnews.io/api/v4/top-headlines?category=${category === "politics" ? "general" : category}&lang=en&country=${country}&max=5&apikey=${apiKey}`;

  const { data } = await axios.get(url, { timeout: TIMEOUT });
  if (!data.articles || data.articles.length === 0)
    throw new Error("No articles");
  return data.articles.map((a) => ({
    title: a.title,
    source: a.source.name,
    pubDate: a.publishedAt,
  }));
}

/**
 * 4. Saurav (Limited Countries)
 */
async function getSauravNews(category, country) {
  const supported = ["us", "in", "gb", "fr", "au", "ru"];
  if (!supported.includes(country)) throw new Error("Country not supported");

  const url = `https://saurav.tech/NewsAPI/top-headlines/category/${category}/${country}.json`;
  const { data } = await axios.get(url, { timeout: TIMEOUT });

  if (!data.articles || data.articles.length === 0)
    throw new Error("No articles");
  return data.articles.map((a) => ({
    title: a.title,
    source: a.source.name,
    pubDate: a.publishedAt,
  }));
}

// ============================================
// MAIN HANDLER
// ============================================

async function newsCommand(sock, chatId, message, args) {
  // Parsing
  const rawQuery = args.join(" ").toLowerCase();

  let country = "us";
  let category = "general";
  let queryTerms = [];

  // Parse args
  for (const arg of args) {
    const lower = arg.toLowerCase();
    if (COUNTRY_MAP[lower]) {
      country = COUNTRY_MAP[lower];
    } else if (CATEGORY_MAP[lower]) {
      category = CATEGORY_MAP[lower];
    } else {
      queryTerms.push(arg);
    }
  }

  // Refine Search Query for Google News (e.g. "Technology Nigeria" or just "Nigeria")
  // If no category specific terms, just use country name
  const countryName =
    Object.entries(COUNTRY_MAP)
      .find(([k, v]) => v === country)?.[0]
      ?.toUpperCase() || country.toUpperCase();

  // Construct search query for Google
  let searchQuery = "";
  if (category !== "general") searchQuery += category + " ";
  if (queryTerms.length > 0) searchQuery += queryTerms.join(" ") + " ";
  searchQuery += countryName;

  const displayName = `${countryName} ${category === "general" ? "Headlines" : category.toUpperCase()}`;

  await sendText(sock, chatId, `📰 *Fetching ${displayName}...*`, {
    quoted: message,
  });

  let articles = null;
  const errors = [];

  // 1. Try Google News RSS (Best for localization)
  try {
    articles = await getGoogleNews(searchQuery, country);
  } catch (e) {
    errors.push("GoogleRSS: " + e.message);
  }

  // 2. Try NewsData
  if (!articles) {
    try {
      articles = await getNewsData(category, country);
    } catch (e) {
      errors.push("NewsData: " + e.message);
    }
  }

  // 3. Try GNews
  if (!articles) {
    try {
      articles = await getGNews(category, country);
    } catch (e) {
      errors.push("GNews: " + e.message);
    }
  }

  // 4. Try Saurav (Only if supported)
  if (!articles) {
    try {
      articles = await getSauravNews(category, country);
    } catch (e) {
      errors.push("Saurav: " + e.message);
    }
  }

  if (!articles || articles.length === 0) {
    return await sendText(
      sock,
      chatId,
      `❌ *No news found for ${displayName}*\n\nTry checking the spelling or try a major country code.`,
      { quoted: message },
    );
  }

  // Build Output (NO LINKS)
  let response = `📰 *${displayName}*\n\n`;

  articles.slice(0, 5).forEach((a, i) => {
    // Clean Title (Often "Title - Source")
    let title = a.title || "No Title";
    // const cleanTitle = title.split(" - ")[0]; // Optional cleanup

    // Clean pubDate
    // const date = a.pubDate ? new Date(a.pubDate).toLocaleDateString() : "";

    response += `${i + 1}. *${title}*\n`;
    response += `_via ${a.source || "News"}_\n\n`;
  });

  response += `_Powered by SAMKIEL BOT_`;

  await sendText(sock, chatId, response.trim(), { quoted: message });
}

module.exports = newsCommand;
