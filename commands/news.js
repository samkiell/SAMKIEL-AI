/**
 * News Command - Real-time news headlines
 * Robust fallback system with 4+ APIs
 * Supports country names and categories
 */

const axios = require("axios");
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
  gh: "gh", // Note: Some APIs might not support GH specifically, will fallback or use specific sources
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
  ke: "ke", // Supported by some
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
  politics: "general",
};

// ============================================
// API IMPLEMENTATIONS
// ============================================

/**
 * API 1: Saurav NewsAPI Mirror (Best for general/tech/business/science/health)
 * Supports: us, in, gb, au, fr, ru
 */
async function getSauravNews(category, country) {
  // Saurav supports limited countries. If not supported, throw to fallback.
  const supported = ["us", "in", "gb", "fr", "au", "ru"];
  if (!supported.includes(country))
    throw new Error("Country not supported by Saurav");

  const url = `https://saurav.tech/NewsAPI/top-headlines/category/${category}/${country}.json`;
  const { data } = await axios.get(url, { timeout: TIMEOUT });

  if (!data.articles || data.articles.length === 0)
    throw new Error("No articles");
  return data.articles;
}

/**
 * API 2: OkSurf (NewsAPI Mirror)
 * Supports "general", "business", "technology", "entertainment", "health", "science", "sports"
 */
async function getOkSurfNews(category) {
  const url = `https://ok.surf/api/v1/cors/news-feed`;
  const { data } = await axios.get(url, { timeout: TIMEOUT });

  const catKey =
    category === "general"
      ? "US"
      : category.charAt(0).toUpperCase() + category.slice(1);
  const articles = data[catKey] || data["World"] || data["US"];

  if (!articles || articles.length === 0) throw new Error("No articles");
  return articles;
}

/**
 * API 3: NewsData.io (Broad country support including NG, GH, KE, ZA)
 */
async function getNewsData(category, country) {
  // Free key (often hits limit, so it's a fallback)
  const apiKey = "pub_640511718ca8e60ba5ebf99f4ce7b25d6d23c";
  let url = `https://newsdata.io/api/1/news?apikey=${apiKey}&language=en`;

  if (country) url += `&country=${country}`;
  if (category && category !== "general") url += `&category=${category}`;

  const { data } = await axios.get(url, { timeout: TIMEOUT });
  if (!data.results || data.results.length === 0)
    throw new Error("No articles");

  return data.results.map((a) => ({
    title: a.title,
    description: a.description,
    url: a.link,
    source: { name: a.source_id },
  }));
}

/**
 * API 4: GNews (Reliable, limited requests)
 */
async function getGNews(category, country) {
  const apiKey = "c08d83b18ca59a6f13a0a950f87fbc59";
  const url = `https://gnews.io/api/v4/top-headlines?category=${category}&lang=en&country=${country}&max=5&apikey=${apiKey}`;

  const { data } = await axios.get(url, { timeout: TIMEOUT });
  if (!data.articles || data.articles.length === 0)
    throw new Error("No articles");
  return data.articles;
}

/**
 * API 5: Spaceflight News (Specific fallback for 'science' or 'tech')
 */
async function getSpaceNews() {
  const url = `https://api.spaceflightnewsapi.net/v4/articles/?limit=5`;
  const { data } = await axios.get(url, { timeout: TIMEOUT });

  if (!data.results || data.results.length === 0)
    throw new Error("No articles");
  return data.results.map((a) => ({
    title: a.title,
    description: a.summary,
    url: a.url,
    source: { name: a.news_site },
  }));
}

// ============================================
// MAIN COMMAND
// ============================================

async function newsCommand(sock, chatId, message, args) {
  let query = args[0]?.toLowerCase() || "general";
  let query2 = args[1]?.toLowerCase();

  // Determine Category and Country
  let category = "general";
  let country = "us";
  let specificTitle = "Global Headlines";

  // Check 1st arg
  if (CATEGORY_MAP[query]) category = CATEGORY_MAP[query];
  else if (COUNTRY_MAP[query]) country = COUNTRY_MAP[query];

  // Check 2nd arg (e.g., "news tech nigeria")
  if (query2) {
    if (CATEGORY_MAP[query2]) category = CATEGORY_MAP[query2];
    else if (COUNTRY_MAP[query2]) country = COUNTRY_MAP[query2];
  }

  // Refine Title
  const countryName =
    Object.keys(COUNTRY_MAP)
      .find((key) => COUNTRY_MAP[key] === country)
      ?.toUpperCase() || country.toUpperCase();
  specificTitle = `${countryName} ${category.charAt(0).toUpperCase() + category.slice(1)} News`;

  await sendText(sock, chatId, `📰 *Fetching ${specificTitle}...*`, {
    quoted: message,
  });

  let articles = null;
  const errors = [];

  // STRATEGY:
  // 1. If 'space' or 'science' -> try SpaceNews first
  // 2. If country is 'ng' (Nigeria) or 'gh' (Ghana) -> prioritize NewsData/GNews as Saurav doesn't support them well
  // 3. General fallback chain

  try {
    // Priority for specific topics
    if (!articles && (category === "science" || query.includes("space"))) {
      try {
        articles = await getSpaceNews();
      } catch (e) {
        errors.push(e.message);
      }
    }

    // Priority for African countries (NewsData/GNews support them better)
    if (!articles && ["ng", "gh", "za", "ke"].includes(country)) {
      try {
        articles = await getNewsData(category, country);
      } catch (e) {
        errors.push("NewsData: " + e.message);
      }
      if (!articles)
        try {
          articles = await getGNews(category, country);
        } catch (e) {
          errors.push("GNews: " + e.message);
        }
    }

    // Standard Chain
    if (!articles)
      try {
        articles = await getSauravNews(category, country);
      } catch (e) {
        errors.push("Saurav: " + e.message);
      }
    if (!articles)
      try {
        articles = await getOkSurfNews(category);
      } catch (e) {
        errors.push("OkSurf: " + e.message);
      }
    if (!articles)
      try {
        articles = await getGNews(category, country);
      } catch (e) {
        errors.push("GNews: " + e.message);
      }
    if (!articles)
      try {
        articles = await getNewsData(category, country);
      } catch (e) {
        errors.push("NewsData: " + e.message);
      }
  } catch (err) {
    console.error("News Command Fatal:", err);
  }

  if (!articles || articles.length === 0) {
    return await sendText(
      sock,
      chatId,
      `❌ *No news found.*\n\nTried to fetch ${category} news for ${country.toUpperCase()}.\nPossibilities:\n1. Server rate limited\n2. Country not supported by free APIs`,
      { quoted: message },
    );
  }

  // Format Response
  let response = `📰 *${specificTitle}*\n\n`;
  const limit = 5;

  articles.slice(0, limit).forEach((a, i) => {
    const title = a.title || "No Title";
    const source = a.source?.name || a.news_site || "Source";
    const url = a.url || "";

    response += `${i + 1}. *${title}*\n`;
    response += `_via ${source}_\n`;
    if (url) response += `${url}\n`;
    response += `\n`;
  });

  response += `_Powered by SAMKIEL BOT_`;

  await sendText(sock, chatId, response.trim(), { quoted: message });
}

module.exports = newsCommand;
