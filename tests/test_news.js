/**
 * Test Suite for News Command
 * Run: node tests/test_news.js
 */

const axios = require("axios");

const TIMEOUT = 10000;

console.log("🧪 Testing News Command APIs...\n");

async function testSauravMirror() {
  console.log("--- Test 1: Saurav NewsAPI Mirror ---");
  try {
    const url =
      "https://saurav.tech/NewsAPI/top-headlines/category/technology/us.json";
    const res = await axios.get(url, { timeout: TIMEOUT });

    if (res.data.articles && res.data.articles.length > 0) {
      console.log("✅ SUCCESS - Saurav Mirror working");
      console.log(`   Found ${res.data.articles.length} articles`);
      console.log(
        `   First: ${res.data.articles[0].title.substring(0, 50)}...`,
      );
    } else {
      console.log("❌ FAILED - No articles");
    }
  } catch (e) {
    console.log(`❌ ERROR: ${e.message}`);
  }
}

async function testGNews() {
  console.log("\n--- Test 2: GNews API ---");
  try {
    const apiKey = "c08d83b18ca59a6f13a0a950f87fbc59";
    const url = `https://gnews.io/api/v4/top-headlines?category=general&lang=en&max=3&apikey=${apiKey}`;
    const res = await axios.get(url, { timeout: TIMEOUT });

    if (res.data.articles && res.data.articles.length > 0) {
      console.log("✅ SUCCESS - GNews working");
      console.log(`   Found ${res.data.articles.length} articles`);
    } else {
      console.log("❌ FAILED - No articles");
    }
  } catch (e) {
    console.log(`❌ ERROR: ${e.message}`);
  }
}

async function testNewsData() {
  console.log("\n--- Test 3: NewsData.io API ---");
  try {
    const apiKey = "pub_640511718ca8e60ba5ebf99f4ce7b25d6d23c";
    const url = `https://newsdata.io/api/1/news?apikey=${apiKey}&category=technology&language=en&country=us`;
    const res = await axios.get(url, { timeout: TIMEOUT });

    if (res.data.results && res.data.results.length > 0) {
      console.log("✅ SUCCESS - NewsData.io working");
      console.log(`   Found ${res.data.results.length} articles`);
    } else {
      console.log("❌ FAILED - No articles");
    }
  } catch (e) {
    console.log(`❌ ERROR: ${e.message}`);
  }
}

async function runTests() {
  await testSauravMirror();
  await testGNews();
  await testNewsData();
  console.log("\n🏁 News Tests Complete");
}

runTests();
