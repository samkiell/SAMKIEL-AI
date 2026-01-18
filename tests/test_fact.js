/**
 * Test Suite for Fact Command
 * Run: node tests/test_fact.js
 */

const axios = require("axios");

const TIMEOUT = 8000;

console.log("🧪 Testing Fact Command APIs...\n");

async function testApiNinjas() {
  console.log("--- Test 1: API Ninjas Facts ---");
  try {
    const url = "https://api.api-ninjas.com/v1/facts?limit=1";
    const res = await axios.get(url, {
      headers: { "X-Api-Key": "2tVLwYJZD3+0FuBrTnrOzA==TL7qWl3Xv1wOH48g" },
      timeout: TIMEOUT,
    });

    if (res.data && res.data[0]?.fact) {
      console.log("✅ SUCCESS - API Ninjas working");
      console.log(`   Fact: ${res.data[0].fact.substring(0, 60)}...`);
    } else {
      console.log("❌ FAILED - No fact returned");
    }
  } catch (e) {
    console.log(`❌ ERROR: ${e.message}`);
  }
}

async function testUselessFacts() {
  console.log("\n--- Test 2: Useless Facts API ---");
  try {
    const url = "https://uselessfacts.jsph.pl/random.json?language=en";
    const res = await axios.get(url, { timeout: TIMEOUT });

    if (res.data?.text) {
      console.log("✅ SUCCESS - Useless Facts working");
      console.log(`   Fact: ${res.data.text.substring(0, 60)}...`);
    } else {
      console.log("❌ FAILED - No fact returned");
    }
  } catch (e) {
    console.log(`❌ ERROR: ${e.message}`);
  }
}

async function testCatFacts() {
  console.log("\n--- Test 3: Cat Facts API ---");
  try {
    const url = "https://catfact.ninja/fact";
    const res = await axios.get(url, { timeout: TIMEOUT });

    if (res.data?.fact) {
      console.log("✅ SUCCESS - Cat Facts working");
      console.log(`   Fact: ${res.data.fact.substring(0, 60)}...`);
    } else {
      console.log("❌ FAILED - No fact returned");
    }
  } catch (e) {
    console.log(`❌ ERROR: ${e.message}`);
  }
}

async function testNumbersApi() {
  console.log("\n--- Test 4: Numbers API ---");
  try {
    const url = "http://numbersapi.com/42/trivia";
    const res = await axios.get(url, { timeout: TIMEOUT });

    if (res.data && typeof res.data === "string") {
      console.log("✅ SUCCESS - Numbers API working");
      console.log(`   Fact: ${res.data.substring(0, 60)}...`);
    } else {
      console.log("❌ FAILED - No fact returned");
    }
  } catch (e) {
    console.log(`❌ ERROR: ${e.message}`);
  }
}

async function runTests() {
  await testApiNinjas();
  await testUselessFacts();
  await testCatFacts();
  await testNumbersApi();
  console.log("\n🏁 Fact Tests Complete");
}

runTests();
