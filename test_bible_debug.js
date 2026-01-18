const axios = require("axios");
const cheerio = require("cheerio");

async function test() {
  console.log("--- TEST 1: Bible-API (john 3:16) ---");
  try {
    const res = await axios.get("https://bible-api.com/john+3:16");
    console.log("Status:", res.status);
    console.log("Data Text:", res.data.text ? "Yes" : "No");
  } catch (e) {
    console.log("Bible-API Error:", e.message);
  }

  console.log("\n--- TEST 2: BibleGateway Search ('ask') ---");
  const version = "NIV";
  const query = "ask";
  const url = `https://www.biblegateway.com/search/?search=${encodeURIComponent(query)}&version=${version}&interface=print`;
  try {
    const res = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    });
    console.log("Status:", res.status);
    const $ = cheerio.load(res.data);
    const passage = $(".passage-content, .passage-text").length;
    const results = $(".search-result-item, .bible-item").length;
    console.log(`Passage found: ${passage}, Results found: ${results}`);
    // Inspect title if no results
    console.log("Page Title:", $("title").text());
  } catch (e) {
    console.log("Gateway Error:", e.message);
  }
}

test();
