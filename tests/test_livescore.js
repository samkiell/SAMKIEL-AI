/**
 * Test Suite for Livescore Command
 * Run: node tests/test_livescore.js
 */

const axios = require("axios");

const TIMEOUT = 10000;

console.log("🧪 Testing Livescore Command APIs...\n");

async function testESPN() {
  console.log("--- Test 1: ESPN API (Premier League) ---");
  try {
    const url =
      "https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/scoreboard";
    const res = await axios.get(url, { timeout: TIMEOUT });

    if (res.data.leagues) {
      console.log("✅ SUCCESS - ESPN API working");
      console.log(`   League: ${res.data.leagues[0].name}`);
      console.log(`   Matches today: ${res.data.events?.length || 0}`);

      if (res.data.events && res.data.events.length > 0) {
        const event = res.data.events[0];
        const comp = event.competitions[0];
        const home = comp.competitors.find((c) => c.homeAway === "home");
        const away = comp.competitors.find((c) => c.homeAway === "away");
        console.log(
          `   First: ${home.team.shortDisplayName} vs ${away.team.shortDisplayName}`,
        );
      }
    }
  } catch (e) {
    console.log(`❌ ERROR: ${e.message}`);
  }
}

async function testESPNChampions() {
  console.log("\n--- Test 2: ESPN API (Champions League) ---");
  try {
    const url =
      "https://site.api.espn.com/apis/site/v2/sports/soccer/uefa.champions/scoreboard";
    const res = await axios.get(url, { timeout: TIMEOUT });

    if (res.data.leagues) {
      console.log("✅ SUCCESS - ESPN UCL working");
      console.log(`   Matches: ${res.data.events?.length || 0}`);
    }
  } catch (e) {
    console.log(`❌ ERROR: ${e.message}`);
  }
}

async function testScoreBat() {
  console.log("\n--- Test 3: ScoreBat API ---");
  try {
    const url = "https://www.scorebat.com/video-api/v3/";
    const res = await axios.get(url, { timeout: TIMEOUT });

    if (res.data.response && res.data.response.length > 0) {
      console.log("✅ SUCCESS - ScoreBat working");
      console.log(`   Recent matches: ${res.data.response.length}`);
      console.log(`   First: ${res.data.response[0].title}`);
    }
  } catch (e) {
    console.log(`❌ ERROR: ${e.message}`);
  }
}

async function runTests() {
  await testESPN();
  await testESPNChampions();
  await testScoreBat();
  console.log("\n🏁 Livescore Tests Complete");
}

runTests();
