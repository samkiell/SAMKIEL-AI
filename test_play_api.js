const axios = require("axios");

async function testPlayApis() {
  const testUrl = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"; // Never Gonna Give You Up
  console.log(`🚀 Starting Audio API Test for URL: ${testUrl}\n`);

  // 1. Widipe API
  try {
    console.log("Testing Widipe API...");
    const start = Date.now();
    const res = await axios.get(
      `https://widipe.com.pl/api/m/dl?url=${encodeURIComponent(testUrl)}`,
    );
    const duration = Date.now() - start;

    if (res.data?.status && res.data?.result?.dl) {
      console.log(`✅ Widipe Success (${duration}ms)`);
      console.log(`   Title: ${res.data.result.title}`);
      console.log(`   DL Link: ${res.data.result.dl.substring(0, 50)}...`);
    } else {
      console.log(`❌ Widipe Failed: Invalid response structure`, res.data);
    }
  } catch (e) {
    console.log(`❌ Widipe Error: ${e.message}`);
  }
  console.log("-".repeat(30));

  // 2. Cobalt API
  try {
    console.log("Testing Cobalt API...");
    const start = Date.now();
    const res = await axios.post(
      "https://api.cobalt.tools/api/json",
      {
        url: testUrl,
        isAudioOnly: true,
      },
      {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      },
    );
    const duration = Date.now() - start;

    if (res.data?.url) {
      console.log(`✅ Cobalt Success (${duration}ms)`);
      console.log(`   DL Link: ${res.data.url.substring(0, 50)}...`);
    } else {
      console.log(`❌ Cobalt Failed: No URL returned`, res.data);
    }
  } catch (e) {
    console.log(`❌ Cobalt Error: ${e.message}`);
  }
  console.log("-".repeat(30));

  // 3. David Cyril API
  try {
    console.log("Testing David Cyril API...");
    const start = Date.now();
    const res = await axios.get(
      `https://apis.davidcyril.name.ng/download/ytmp3?url=${encodeURIComponent(
        testUrl,
      )}`,
    );
    const duration = Date.now() - start;

    if (res.data?.success && res.data?.result?.download_url) {
      console.log(`✅ David Cyril Success (${duration}ms)`);
      console.log(`   Title: ${res.data.result.title}`);
      console.log(
        `   DL Link: ${res.data.result.download_url.substring(0, 50)}...`,
      );
    } else {
      console.log(`❌ David Cyril Failed: Invalid response`, res.data);
    }
  } catch (e) {
    console.log(`❌ David Cyril Error: ${e.message}`);
  }

  console.log("\n🏁 Test Complete");
}

testPlayApis();
