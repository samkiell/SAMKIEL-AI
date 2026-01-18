/**
 * Master Test Runner - Run All Tests
 * Run: node tests/run_all.js
 */

const { execSync } = require("child_process");
const path = require("path");

const tests = [
  "test_bible.js",
  "test_crypto.js",
  "test_weather.js",
  "test_news.js",
  "test_fact.js",
  "test_livescore.js",
];

console.log("═══════════════════════════════════════════════════");
console.log("   🧪 SAMKIEL BOT - API TEST SUITE");
console.log("═══════════════════════════════════════════════════\n");

async function runTest(testFile) {
  console.log(`\n${"═".repeat(50)}`);
  console.log(`Running: ${testFile}`);
  console.log("═".repeat(50));

  try {
    const testPath = path.join(__dirname, testFile);
    execSync(`node "${testPath}"`, { stdio: "inherit" });
  } catch (e) {
    console.error(`Error running ${testFile}`);
  }
}

async function main() {
  for (const test of tests) {
    await runTest(test);
  }

  console.log("\n" + "═".repeat(50));
  console.log("   🏁 ALL TESTS COMPLETED");
  console.log("═".repeat(50) + "\n");
}

main();
