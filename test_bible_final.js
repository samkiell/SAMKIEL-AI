const axios = require("axios");

async function testBibleFix() {
  console.log("🚀 Testing Bible Command Fixes...\n");

  // 1. Test Bolls Search (Keyword)
  console.log("--- Test 1: Bolls Search ('ask') ---");
  try {
    const query = "ask";
    const url = `https://bolls.life/find/NIV/?search=${encodeURIComponent(query)}`;
    console.log(`Endpoint: ${url}`);
    const res = await axios.get(url);

    if (res.data && res.data.length > 0) {
      console.log(`✅ Success! Found ${res.data.length} results.`);
      console.log(`Snippet: ${res.data[0].text.substring(0, 50)}...`);
    } else {
      console.log("❌ Failed: No results/Invalid format");
    }
  } catch (e) {
    console.log(`❌ Error: ${e.message}`);
  }

  // 2. Test Bible SuperSearch (Backup)
  console.log("\n--- Test 2: Bible SuperSearch ('john 3:16') ---");
  try {
    const query = "john 3:16";
    const url = `https://api.biblesupersearch.com/api/bible/search?q=${encodeURIComponent(query)}`;
    console.log(`Endpoint: ${url}`);
    // Note: SuperSearch might be stricter or different structure, testing connectivity.
    const res = await axios.get(url);

    if (res.status === 200) {
      console.log(`✅ Success! Status 200 OK.`);
      // console.log(JSON.stringify(res.data).substring(0, 100));
    } else {
      console.log("❌ Failed: Status " + res.status);
    }
  } catch (e) {
    // SuperSearch might fail if query format is specific, but checking connectivity.
    console.log(`⚠️ Warning: ${e.message} (might be query format specific)`);
  }

  console.log("\n🏁 Test Complete");
}

testBibleFix();
