const axios = require("axios");
const cheerio = require("cheerio");
const { sendText } = require("../lib/sendResponse");

/**
 * Bible Command
 * Supports:
 * 1. Direct Verse Reference (via bible-api.com) with flexible translation logic.
 *    - Defaults to NIV if no version is specified.
 *    - Example: ".bible john 3:16" -> NIV
 *    - Example: ".bible john 3:16 kjv" -> KJV
 * 2. Keyword Search (via BibleGateway scraping)
 */
async function bibleCommand(sock, chatId, args) {
  if (!args || args.length === 0) {
    return await sendText(
      sock,
      chatId,
      "🔍 Please provide a verse reference OR a search query.\nExample:\n• Reference: *.bible john 3:16*\n• Search: *.bible jesus wept*",
    );
  }

  // 1. Translation Detection
  // Check the last argument to see if it's a known short version code (e.g., kjv, nlt, esv)
  // Common codes: kjv, nkjv, niv, esv, nasb, nlt, amp, msg, web
  const commonVersions = [
    "kjv",
    "nkjv",
    "niv",
    "esv",
    "nasb",
    "nlt",
    "amp",
    "msg",
    "web",
    "rsv",
  ];
  let translation = "niv"; // Default

  const lastArg = args[args.length - 1].toLowerCase();
  let queryArgs = [...args]; // Copy args to modify

  if (commonVersions.includes(lastArg)) {
    translation = lastArg;
    queryArgs.pop(); // Remove the version from the query text
  }

  let query = queryArgs.join(" ").trim();

  // 2. Smart pattern fix for References (e.g., "john 4 26" -> "john 4:26")
  const regex = /(\d+)\s+(\d+)(?:-(\d+))?$/;
  if (regex.test(query) && !query.includes(":")) {
    const potentialRef = query.replace(regex, (match, ch, vStart, vEnd) => {
      return `${ch}:${vStart}${vEnd ? "-" + vEnd : ""}`;
    });
    query = potentialRef;
  }

  try {
    // Show typing state
    await sock.sendPresenceUpdate("composing", chatId);

    // --- TRY DIRECT LOOKUP ---
    try {
      // NOTE: bible-api.com handles many versions via ?translation=
      // However, it doesn't support ALL versions (like NLT might fail or default to other).
      // We will try to fetch.
      const response = await axios.get(
        `https://bible-api.com/${encodeURIComponent(query)}?translation=${translation}`,
        { timeout: 5000 },
      );

      const data = response.data;
      if (data && data.text) {
        // Double check if data.text is empty or "verse not found" logic (some APIs return 200 with error msg)
        // bible-api.com returns actual text or 404.

        const { reference, text, translation_name } = data;
        const formattedBible = `📖 *${reference}*\n\n${text.trim()}\n\n_— ${translation_name}_`;
        return await sendText(sock, chatId, formattedBible);
      }
    } catch (refError) {
      if (refError.response?.status !== 404) {
        console.error("Bible Ref API Error:", refError.message);
      }
      // If 404, we continue to search...
    }

    // --- FALLBACK: SEARCH MODE (BIBLEGATEWAY) ---
    // If direct lookup fail, we assume it's a keyword search OR a complex reference that API missed.
    await searchBible(sock, chatId, args.join(" "), translation); // Use original raw query for search to be safe? No, let's use the cleaned query without version key
  } catch (error) {
    console.error("Bible Command Error:", error.message);
    await sendText(
      sock,
      chatId,
      "❌ Failed to process request. Please try again.",
    );
  }
}

/**
 * Scrapes BibleGateway for search results
 */
async function searchBible(sock, chatId, searchQuery, version = "NIV") {
  try {
    // Determine if user is searching or looking up a reference that failed API
    // BibleGateway is robust for both.
    const url = `https://www.biblegateway.com/quicksearch/?quicksearch=${encodeURIComponent(searchQuery)}&version=${version.toUpperCase()}`;

    const { data } = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    });

    const $ = cheerio.load(data);
    const results = [];

    // BibleGateway general search results
    $(".search-result-list-item").each((i, el) => {
      if (i >= 5) return;
      const reference = $(el)
        .find(".search-result-list-item-header a")
        .text()
        .trim();
      const snippet = $(el)
        .find(".search-result-list-item-preview")
        .text()
        .trim();
      if (reference && snippet) {
        results.push({ reference, snippet });
      }
    });

    if (results.length > 0) {
      let msg = `🔍 *Bible Search Results (${version.toUpperCase()}): "${searchQuery}"*\n\n`;
      results.forEach((res) => {
        msg += `📜 *${res.reference}*\n"${res.snippet}"\n\n`;
      });
      return await sendText(sock, chatId, msg);
    }

    // --- SPECIAL HANDLING: NON-EXISTENT CHAPTERS/VERSES ---
    // If no results, check if it was a "verse lookup" attempt that failed.
    // BibleGateway usually shows "No results found" logic.
    // We can try to parse the query to see if it looks like a verse reference (Book Chapter:Verse)
    // and give a witty error.

    // Regex for "Book Chapter:Verse" pattern roughly
    const verseCappedRegex = /([1-3]?\s?[a-zA-Z]+)\s+(\d+)(?::(\d+))?/;
    const match = searchQuery.match(verseCappedRegex);

    if (match) {
      // It looked like a verse request but returned nothing.
      // Likely chapter/verse out of bounds.
      await sendText(
        sock,
        chatId,
        `❌ *Reference not found in ${version.toUpperCase()}.*\n\n` +
          `Make sure the chapter or verse actually exists.\n` +
          `_Psst... You might want to flip through your Bible again!_ 📖😅`,
      );
      return;
    }

    // Generic no result
    await sendText(sock, chatId, `❌ No results found for: "${searchQuery}"`);
  } catch (err) {
    console.error("Bible Search Error:", err.message);
    await sendText(sock, chatId, "❌ Search functionality invalid or blocked.");
  }
}

module.exports = bibleCommand;
