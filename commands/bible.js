/**
 * Enhanced Bible Command (v5.0)
 *
 * Features:
 * 1. Smart detection: Reference vs Search
 * 2. Primary API: bible-api.com (fast, JSON)
 * 3. Fallback: Bolls Life API (comprehensive)
 * 4. Proper book name mapping
 * 5. No branding/notes
 */

const axios = require("axios");
const { sendText } = require("../lib/sendResponse");

const TIMEOUT = 10000;

// Complete Bible Book Mapping
const BOOK_NAMES = {
  1: "Genesis",
  2: "Exodus",
  3: "Leviticus",
  4: "Numbers",
  5: "Deuteronomy",
  6: "Joshua",
  7: "Judges",
  8: "Ruth",
  9: "1 Samuel",
  10: "2 Samuel",
  11: "1 Kings",
  12: "2 Kings",
  13: "1 Chronicles",
  14: "2 Chronicles",
  15: "Ezra",
  16: "Nehemiah",
  17: "Esther",
  18: "Job",
  19: "Psalms",
  20: "Proverbs",
  21: "Ecclesiastes",
  22: "Song of Solomon",
  23: "Isaiah",
  24: "Jeremiah",
  25: "Lamentations",
  26: "Ezekiel",
  27: "Daniel",
  28: "Hosea",
  29: "Joel",
  30: "Amos",
  31: "Obadiah",
  32: "Jonah",
  33: "Micah",
  34: "Nahum",
  35: "Habakkuk",
  36: "Zephaniah",
  37: "Haggai",
  38: "Zechariah",
  39: "Malachi",
  40: "Matthew",
  41: "Mark",
  42: "Luke",
  43: "John",
  44: "Acts",
  45: "Romans",
  46: "1 Corinthians",
  47: "2 Corinthians",
  48: "Galatians",
  49: "Ephesians",
  50: "Philippians",
  51: "Colossians",
  52: "1 Thessalonians",
  53: "2 Thessalonians",
  54: "1 Timothy",
  55: "2 Timothy",
  56: "Titus",
  57: "Philemon",
  58: "Hebrews",
  59: "James",
  60: "1 Peter",
  61: "2 Peter",
  62: "1 John",
  63: "2 John",
  64: "3 John",
  65: "Jude",
  66: "Revelation",
};

// Book name aliases for parsing
const BOOK_ALIASES = {
  gen: "genesis",
  ge: "genesis",
  gn: "genesis",
  ex: "exodus",
  exod: "exodus",
  lev: "leviticus",
  le: "leviticus",
  lv: "leviticus",
  num: "numbers",
  nu: "numbers",
  nm: "numbers",
  deut: "deuteronomy",
  de: "deuteronomy",
  dt: "deuteronomy",
  josh: "joshua",
  jos: "joshua",
  judg: "judges",
  jdg: "judges",
  jg: "judges",
  ru: "ruth",
  rth: "ruth",
  "1sam": "1 samuel",
  "1sa": "1 samuel",
  "1 sam": "1 samuel",
  "2sam": "2 samuel",
  "2sa": "2 samuel",
  "2 sam": "2 samuel",
  "1kgs": "1 kings",
  "1ki": "1 kings",
  "1 kings": "1 kings",
  "2kgs": "2 kings",
  "2ki": "2 kings",
  "2 kings": "2 kings",
  "1chr": "1 chronicles",
  "1ch": "1 chronicles",
  "2chr": "2 chronicles",
  "2ch": "2 chronicles",
  ezr: "ezra",
  neh: "nehemiah",
  ne: "nehemiah",
  esth: "esther",
  es: "esther",
  jb: "job",
  ps: "psalms",
  psa: "psalms",
  psalm: "psalms",
  prov: "proverbs",
  pr: "proverbs",
  prv: "proverbs",
  eccl: "ecclesiastes",
  ec: "ecclesiastes",
  ecc: "ecclesiastes",
  song: "song of solomon",
  sos: "song of solomon",
  ss: "song of solomon",
  isa: "isaiah",
  is: "isaiah",
  jer: "jeremiah",
  je: "jeremiah",
  lam: "lamentations",
  la: "lamentations",
  ezek: "ezekiel",
  eze: "ezekiel",
  ez: "ezekiel",
  dan: "daniel",
  da: "daniel",
  dn: "daniel",
  hos: "hosea",
  ho: "hosea",
  joe: "joel",
  jl: "joel",
  am: "amos",
  ob: "obadiah",
  oba: "obadiah",
  jon: "jonah",
  jnh: "jonah",
  mic: "micah",
  mi: "micah",
  nah: "nahum",
  na: "nahum",
  hab: "habakkuk",
  zeph: "zephaniah",
  zep: "zephaniah",
  hag: "haggai",
  hg: "haggai",
  zech: "zechariah",
  zec: "zechariah",
  mal: "malachi",
  matt: "matthew",
  mt: "matthew",
  mat: "matthew",
  mk: "mark",
  mr: "mark",
  lk: "luke",
  lu: "luke",
  jn: "john",
  joh: "john",
  ac: "acts",
  act: "acts",
  rom: "romans",
  ro: "romans",
  rm: "romans",
  "1cor": "1 corinthians",
  "1co": "1 corinthians",
  "2cor": "2 corinthians",
  "2co": "2 corinthians",
  gal: "galatians",
  ga: "galatians",
  eph: "ephesians",
  ep: "ephesians",
  phil: "philippians",
  php: "philippians",
  pp: "philippians",
  col: "colossians",
  "1thess": "1 thessalonians",
  "1th": "1 thessalonians",
  "2thess": "2 thessalonians",
  "2th": "2 thessalonians",
  "1tim": "1 timothy",
  "1ti": "1 timothy",
  "2tim": "2 timothy",
  "2ti": "2 timothy",
  tit: "titus",
  ti: "titus",
  phm: "philemon",
  phlm: "philemon",
  heb: "hebrews",
  jas: "james",
  jm: "james",
  "1pet": "1 peter",
  "1pe": "1 peter",
  "1pt": "1 peter",
  "2pet": "2 peter",
  "2pe": "2 peter",
  "2pt": "2 peter",
  "1jn": "1 john",
  "1jo": "1 john",
  "2jn": "2 john",
  "2jo": "2 john",
  "3jn": "3 john",
  "3jo": "3 john",
  jud: "jude",
  jde: "jude",
  rev: "revelation",
  re: "revelation",
  rv: "revelation",
};

// Translation mapping
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

/**
 * Detect if query is a Bible reference (book chapter:verse) or a search query
 */
function parseQuery(queryArgs) {
  if (!queryArgs || queryArgs.length === 0) return { type: "help" };

  // Check if last arg is a translation
  let version = "NIV";
  let args = [...queryArgs];
  const lastArg = args[args.length - 1].toLowerCase();
  if (TRANSLATIONS[lastArg]) {
    version = TRANSLATIONS[lastArg];
    args.pop();
  }

  const query = args.join(" ").trim();
  if (!query) return { type: "help" };

  // Pattern 1: "John 3:16" or "1 John 1:9" or "Genesis 1:1-5"
  const refPattern1 = /^(\d?\s?[a-zA-Z]+)\s+(\d+):(\d+)(?:-(\d+))?$/i;
  // Pattern 2: "John 3 16" (space instead of colon)
  const refPattern2 = /^(\d?\s?[a-zA-Z]+)\s+(\d+)\s+(\d+)(?:\s*-\s*(\d+))?$/i;
  // Pattern 3: "phil 4 19" (abbreviation with spaces)
  const refPattern3 = /^([a-zA-Z]+)\s+(\d+)\s+(\d+)(?:\s*-\s*(\d+))?$/i;

  let match =
    query.match(refPattern1) ||
    query.match(refPattern2) ||
    query.match(refPattern3);

  if (match) {
    let bookPart = match[1].toLowerCase().trim();
    const chapter = match[2];
    const verseStart = match[3];
    const verseEnd = match[4];

    // Expand abbreviation
    if (BOOK_ALIASES[bookPart]) {
      bookPart = BOOK_ALIASES[bookPart];
    }

    // Build reference string
    let reference = `${bookPart} ${chapter}:${verseStart}`;
    if (verseEnd) reference += `-${verseEnd}`;

    return { type: "reference", reference, version, original: query };
  }

  // It's a search query
  return { type: "search", query, version };
}

/**
 * API 1: bible-api.com (Primary for references)
 */
async function getBibleApi(reference, version) {
  // bible-api supports: kjv, web, and a few others
  const versionMap = { KJV: "kjv", WEB: "web", ASV: "asv" };
  const apiVersion = versionMap[version] || "kjv"; // Default to KJV if not supported

  const url = `https://bible-api.com/${encodeURIComponent(reference)}?translation=${apiVersion}`;
  const { data } = await axios.get(url, { timeout: TIMEOUT });

  if (!data.text) throw new Error("No text found");

  return {
    reference: data.reference,
    text: data.text.trim(),
    verses: data.verses,
    translation: data.translation_name || version,
  };
}

/**
 * API 2: Bolls Life API (Fallback, supports many translations)
 */
async function getBollsReference(reference, version) {
  // Parse reference to match Bolls format
  // Format: /get-text/VERSION/BOOK/CHAPTER/VERSE/
  // This is tricky - need to convert "John 3:16" to /get-text/NIV/John/3/16/

  // For now, use search as fallback
  const url = `https://bolls.life/find/${version}/?search=${encodeURIComponent(reference)}`;
  const { data } = await axios.get(url, { timeout: TIMEOUT });

  if (!data || data.length === 0) throw new Error("No results");

  // Take first result
  const verse = data[0];
  const bookName = BOOK_NAMES[verse.book] || `Book ${verse.book}`;

  return {
    reference: `${bookName} ${verse.chapter}:${verse.verse}`,
    text: verse.text.replace(/<[^>]*>/g, ""), // Remove HTML
    translation: version,
  };
}

/**
 * API 3: Bolls Life Search (For keyword searches)
 */
async function getBollsSearch(query, version, limit = 10) {
  const url = `https://bolls.life/find/${version}/?search=${encodeURIComponent(query)}`;
  const { data } = await axios.get(url, { timeout: TIMEOUT });

  if (!data || data.length === 0) throw new Error("No results");

  return data.slice(0, limit).map((verse) => ({
    reference: `${BOOK_NAMES[verse.book] || `Book ${verse.book}`} ${verse.chapter}:${verse.verse}`,
    text: verse.text
      .replace(/<[^>]*>/g, "")
      .replace(/<mark>/g, "")
      .replace(/<\/mark>/g, ""),
  }));
}

async function bibleCommand(sock, chatId, args) {
  const parsed = parseQuery(args);

  if (parsed.type === "help") {
    return await sendText(
      sock,
      chatId,
      "📖 *Bible Command*\n\n" +
        "*Reference Lookup:*\n" +
        "• .bible John 3:16\n" +
        "• .bible phil 4 19\n" +
        "• .bible Genesis 1:1-5 kjv\n\n" +
        "*Keyword Search:*\n" +
        "• .bible ask and you shall receive\n" +
        "• .bible love one another\n\n" +
        "*Translations:* NIV, KJV, ESV, NLT, NKJV, ASV",
    );
  }

  try {
    await sock.sendPresenceUpdate("composing", chatId);

    if (parsed.type === "reference") {
      // Try bible-api first
      let result = null;
      try {
        result = await getBibleApi(parsed.reference, parsed.version);
      } catch (e) {
        console.log("Bible: bible-api failed, trying Bolls...");
      }

      // Try Bolls as fallback
      if (!result) {
        try {
          result = await getBollsReference(parsed.reference, parsed.version);
        } catch (e) {
          console.log("Bible: Bolls failed");
        }
      }

      if (!result) {
        return await sendText(
          sock,
          chatId,
          `❌ Could not find: ${parsed.original}\n\nTry using full book names like "Philippians 4:19"`,
        );
      }

      // Format multi-verse
      let text = result.text;
      if (result.verses && result.verses.length > 1) {
        text = result.verses
          .map((v) => `*${v.verse}.* ${v.text.trim()}`)
          .join("\n");
      }

      const msg = `📖 *${result.reference}*\n\n${text}\n\n_— ${result.translation}_\n\n*Powered by SAMKIEL BOT*`;
      return await sendText(sock, chatId, msg);
    } else if (parsed.type === "search") {
      // Keyword search
      let results = null;
      try {
        results = await getBollsSearch(parsed.query, parsed.version, 10);
      } catch (e) {
        console.log("Bible: Search failed");
      }

      if (!results || results.length === 0) {
        return await sendText(
          sock,
          chatId,
          `❌ No results found for: "${parsed.query}"`,
        );
      }

      let msg = `🔍 *Bible Search: "${parsed.query}"* (${parsed.version})\n\n`;
      results.forEach((r, i) => {
        const snippet =
          r.text.length > 120 ? r.text.substring(0, 120) + "..." : r.text;
        msg += `${i + 1}. *${r.reference}*\n"${snippet}"\n\n`;
      });

      msg += `*Powered by SAMKIEL BOT*`;
      return await sendText(sock, chatId, msg.trim());
    }
  } catch (error) {
    console.error("Bible Command Error:", error.message);
    await sendText(
      sock,
      chatId,
      "❌ Failed to fetch Bible data. Please try again.",
    );
  }
}

// Command metadata
bibleCommand.meta = {
  name: "bible",
  aliases: ["verse", "scripture"],
  ownerOnly: false,
  adminOnly: false,
  groupOnly: false,
  lockdownBlocked: true,
  ratelimited: true,
  silenceBlocked: true,
  description: "Look up Bible verses or search",
};

module.exports = bibleCommand;
