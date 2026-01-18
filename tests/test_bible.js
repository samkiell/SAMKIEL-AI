/**
 * Test Suite for Bible Command
 * Run: node tests/test_bible.js
 */

const axios = require("axios");

const TIMEOUT = 10000;

// Book name mapping
const BOOK_NAMES = {
  1: "Genesis",
  43: "John",
  50: "Philippians",
  45: "Romans",
  19: "Psalms",
  40: "Matthew",
};

console.log("🧪 Testing Bible Command APIs...\n");

async function testBibleApi() {
  console.log("--- Test 1: bible-api.com (Reference) ---");
  try {
    const url = "https://bible-api.com/john+3:16?translation=kjv";
    const res = await axios.get(url, { timeout: TIMEOUT });
    if (res.data.text) {
      console.log("✅ SUCCESS - bible-api.com working");
      console.log(`   Reference: ${res.data.reference}`);
      console.log(`   Text: ${res.data.text.substring(0, 60)}...`);
    } else {
      console.log("❌ FAILED - No text returned");
    }
  } catch (e) {
    console.log(`❌ ERROR: ${e.message}`);
  }
}

async function testBollsSearch() {
  console.log("\n--- Test 2: Bolls Life API (Search) ---");
  try {
    const url = "https://bolls.life/find/NIV/?search=love+one+another";
    const res = await axios.get(url, { timeout: TIMEOUT });
    if (res.data && res.data.length > 0) {
      console.log(`✅ SUCCESS - Found ${res.data.length} results`);
      const first = res.data[0];
      const bookName = BOOK_NAMES[first.book] || `Book ${first.book}`;
      console.log(`   First: ${bookName} ${first.chapter}:${first.verse}`);
    } else {
      console.log("❌ FAILED - No results");
    }
  } catch (e) {
    console.log(`❌ ERROR: ${e.message}`);
  }
}

async function testBollsReference() {
  console.log("\n--- Test 3: Bolls Life API (Reference) ---");
  try {
    const url = "https://bolls.life/find/NIV/?search=philippians+4:19";
    const res = await axios.get(url, { timeout: TIMEOUT });
    if (res.data && res.data.length > 0) {
      const first = res.data[0];
      const bookName = BOOK_NAMES[first.book] || `Book ${first.book}`;
      console.log(
        `✅ SUCCESS - Found ${bookName} ${first.chapter}:${first.verse}`,
      );
      console.log(`   Text: ${first.text.substring(0, 60)}...`);
    } else {
      console.log("❌ FAILED - No results");
    }
  } catch (e) {
    console.log(`❌ ERROR: ${e.message}`);
  }
}

async function testQueryParsing() {
  console.log("\n--- Test 4: Query Parsing Logic ---");

  const testCases = [
    { input: "john 3:16", expected: "reference" },
    { input: "phil 4 19", expected: "reference" },
    { input: "1 John 1:9", expected: "reference" },
    { input: "ask and you shall receive", expected: "search" },
    { input: "love", expected: "search" },
    { input: "Genesis 1:1-5", expected: "reference" },
  ];

  const refPattern1 = /^(\d?\s?[a-zA-Z]+)\s+(\d+):(\d+)(?:-(\d+))?$/i;
  const refPattern2 = /^(\d?\s?[a-zA-Z]+)\s+(\d+)\s+(\d+)(?:\s*-\s*(\d+))?$/i;

  testCases.forEach((tc) => {
    const isRef = refPattern1.test(tc.input) || refPattern2.test(tc.input);
    const detected = isRef ? "reference" : "search";
    const status = detected === tc.expected ? "✅" : "❌";
    console.log(
      `${status} "${tc.input}" → ${detected} (expected: ${tc.expected})`,
    );
  });
}

async function runTests() {
  await testBibleApi();
  await testBollsSearch();
  await testBollsReference();
  testQueryParsing();
  console.log("\n🏁 Bible Tests Complete");
}

runTests();
