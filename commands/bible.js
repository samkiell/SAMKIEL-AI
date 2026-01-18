const axios = require("axios");
const cheerio = require("cheerio");
const { sendText } = require("../lib/sendResponse");

/**
 * Enhanced Bible Command (v4.0)
 *
 * Capabilities:
 * 1. Primary API: Bible-API.com (Free, Fast, JSON) - supports limited versions (NIV, KJV, etc.)
 * 2. Secondary API: Bible SuperSearch (bible-api.com fallback)
 * 3. Robust Scraping: BibleGateway (The "Gold Standard" for finding anything)
 *    - Handles simple verses AND full text search.
 *    - Supports almost ALL translations (NIV, KJV, ESV, NLT, NKJV, NASB, MSG, AMP, etc.)
 */

// List of translations we want to "officially" recognize, though scraper handles anything.
const TRANSLATIONS = {
  niv: "NIV",
  kjv: "KJV",
  nkjv: "NKJV",
  esv: "ESV",
  nasb: "NASB",
  nlt: "NLT",
  amp: "AMP",
  msg: "MSG",
  web: "WEB",
  rsv: "RSV",
  asv: "ASV",
  net: "NET",
  nrs: "NRSV",
};

async function bibleCommand(sock, chatId, args) {
  if (!args || args.length === 0) {
    return await sendText(
      sock,
      chatId,
      "🔍 Please provide a verse reference OR a search query.\nExample:\n• Reference: *.bible john 3:16*\n• Search: *.bible ask and it shall be given*\n• Version: *.bible john 3:16 esv*",
    );
  }

  // --- 1. Parse Version ---
  let version = "NIV"; // Default
  let queryArgs = [...args];
  const lastArg = queryArgs[queryArgs.length - 1].toLowerCase();

  if (TRANSLATIONS[lastArg]) {
    version = TRANSLATIONS[lastArg];
    queryArgs.pop(); // Remove version from query
  }

  // Construct the search text
  let query = queryArgs.join(" ").trim();

  // Clean query for smart formatting (e.g., "john 3 16" -> "john 3:16")
  // Only applies if it strictly looks like [Book Chapter Verse]
  const refRegex = /^([1-3]?\s?[a-zA-Z]+)\s+(\d+)\s+(\d+)(?:-(\d+))?$/;
  const directRefMatch = query.match(refRegex);
  if (directRefMatch) {
    // Reformat "john 3 16" to "john 3:16" for better API hits, but keep original for search fallback
    // query = `${directRefMatch[1]} ${directRefMatch[2]}:${directRefMatch[3]}`;
    // Getting clever can break search phrases, so valid reference formatting helps APIs.
    query = query.replace(refRegex, (match, book, ch, start, end) => {
      return `${book} ${ch}:${start}${end ? "-" + end : ""}`;
    });
  }

  try {
    // Show typing state
    await sock.sendPresenceUpdate("composing", chatId);

    // --- STRATEGY 1: bible-api.com (Fastest, JSON, Exact References Only) ---
    // Only works if the query IS a reference. It fails on "search text".
    // Also, it only supports a few versions perfectly.
    // If user asked for 'WEB' or 'KJV' or 'Bible-API supported', we try this.
    // If user asked for 'NLT' or 'NIV' (sometimes hidden), it might fail or return WEB.
    // We try it first ONLY if it looks like a reference.
    const isReferenceLayout = /[0-9]+:[0-9]+/.test(query);

    if (isReferenceLayout) {
      try {
        // bible-api.com uses `?translation=` but limited support.
        // We try. If it 404s, we move to scraper.
        const cleanVersion = version.toLowerCase(); // bible-api likes lowercase
        const apiUrl = `https://bible-api.com/${encodeURIComponent(query)}?translation=${cleanVersion}`;

        const res = await axios.get(apiUrl, { timeout: 4000 });
        if (res.data && res.data.text) {
          const { reference, verses, text, translation_name } = res.data;
          let body = text.trim();
          // Multi-verse formatting
          if (verses?.length > 1) {
            body = verses
              .map((v) => `*${v.verse}.* ${v.text.trim()}`)
              .join("\n");
          }
          const msg = `📖 *${reference}*\n\n${body}\n\n_— ${translation_name}_`;
          return await sendText(sock, chatId, msg);
        }
      } catch (e) {
        // Ignore and flow to next strategy
      }
    }

    // --- STRATEGY 2: THE "VAST SEARCH" (BibleGateway Scraper) ---
    // This is the fallback for everything:
    // 1. Complex References that API missed.
    // 2. Keyword Searches ("ask and ye shall find").
    // 3. Translations not on free APIs (NLT, MSG, AMP).

    await performVastSearch(sock, chatId, query, version);
  } catch (error) {
    console.error("Bible Command Fatal:", error);
    await sendText(
      sock,
      chatId,
      "❌ Failed to fetch Bible data. Please try again.",
    );
  }
}

/**
 * The Robust Scraper using BibleGateway
 * Handles both "Search Results" AND "Passage Display"
 */
async function performVastSearch(sock, chatId, query, version) {
  try {
    // We use the '/search/' endpoint.
    // If it's a specific reference (e.g. John 3:16), BibleGateway might show the full text directly.
    // If it's a keyword (e.g. Jesus wept), it shows a LIST of results.
    // We need to handle both layouts.

    const url = `https://www.biblegateway.com/search/?search=${encodeURIComponent(query)}&version=${version}&interface=print`;
    // using interface=print often simplifies the DOM!

    const config = {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    };

    const { data } = await axios.get(url, config);
    const $ = cheerio.load(data);

    // --- CASE A: DIRECT PASSAGE (It found the exact verse/chapter) ---
    // BibleGateway "Print View" puts content in .passage-content or .prose
    const passageContent = $(".passage-content, .passage-text").first();

    if (passageContent.length > 0) {
      // It found a direct match!
      // We need to extract the text cleanly.

      // Remove superscripts / cross-refs if possible
      $(".crossreference, .footnote, .chapternum, .versenum").remove(); // optionally keep versenums if desired?
      // Actually, keep verse numbers for multi-verse, but they are often messy in print view.
      // Let's rely on text() but maybe clean it up.

      // Extract Title
      const refTitle =
        $(".bcv, .dropdown-display-text").first().text().trim() || query;

      // Extract Text
      // We iterate paragraphs specifically to keep newlines
      let fullText = "";
      $(".passage-content p").each((i, el) => {
        fullText += $(el).text().trim() + "\n\n";
      });

      if (!fullText) fullText = passageContent.text().trim(); // Fallback

      // Limit length for WhatsApp
      if (fullText.length > 3000)
        fullText = fullText.substring(0, 3000) + "... [Read more on Web]";

      const msg = `📖 *${refTitle}* (${version})\n\n${fullText.trim()}`;
      return await sendText(sock, chatId, msg);
    }

    // --- CASE B: SEARCH RESULTS LIST (It found multiple matches) ---
    // Selectors for search results
    let results = [];

    $(".search-result-item, .bible-item").each((i, el) => {
      if (i >= 5) return;

      const title = $(el)
        .find(".search-result-header, .bible-item-title")
        .text()
        .trim();
      const snippet = $(el)
        .find(".search-result-content, .bible-item-content")
        .text()
        .trim();

      if (title && snippet) {
        results.push({ title, snippet });
      }
    });

    if (results.length > 0) {
      let msg = `🔍 *Bible Search: "${query}"* (${version})\n\n`;
      results.forEach((r) => {
        msg += `📜 *${r.title}*\n${r.snippet}\n\n`;
      });
      return await sendText(sock, chatId, msg);
    }

    // --- CASE C: NO RESULTS ---
    // Check for "No results found" message
    await sendText(
      sock,
      chatId,
      `❌ No results found for "${query}" in ${version}.`,
    );
  } catch (e) {
    console.error("Vast Search Error:", e);
    await sendText(
      sock,
      chatId,
      "❌ Search failed. Please try a simpler query.",
    );
  }
}

module.exports = bibleCommand;
