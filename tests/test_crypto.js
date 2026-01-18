/**
 * Test Suite for Crypto Command
 * Run: node tests/test_crypto.js
 */

const axios = require("axios");

const TIMEOUT = 10000;

console.log("🧪 Testing Crypto Command APIs...\n");

async function testCoinGecko() {
  console.log("--- Test 1: CoinGecko API ---");
  try {
    const url = "https://api.coingecko.com/api/v3/coins/bitcoin";
    const res = await axios.get(url, { timeout: TIMEOUT });
    if (res.data.market_data) {
      const price = res.data.market_data.current_price.usd;
      const change = res.data.market_data.price_change_percentage_24h;
      console.log("✅ SUCCESS - CoinGecko working");
      console.log(
        `   Bitcoin: $${price.toLocaleString()} (${change > 0 ? "+" : ""}${change.toFixed(2)}%)`,
      );
    }
  } catch (e) {
    console.log(`❌ ERROR: ${e.message}`);
  }
}

async function testCoinCap() {
  console.log("\n--- Test 2: CoinCap API ---");
  try {
    const url = "https://api.coincap.io/v2/assets/ethereum";
    const res = await axios.get(url, { timeout: TIMEOUT });
    if (res.data.data) {
      const coin = res.data.data;
      console.log("✅ SUCCESS - CoinCap working");
      console.log(`   ${coin.name}: $${parseFloat(coin.priceUsd).toFixed(2)}`);
    }
  } catch (e) {
    console.log(`❌ ERROR: ${e.message}`);
  }
}

async function testCoinPaprika() {
  console.log("\n--- Test 3: CoinPaprika API ---");
  try {
    const url = "https://api.coinpaprika.com/v1/tickers/btc-bitcoin";
    const res = await axios.get(url, { timeout: TIMEOUT });
    if (res.data.quotes) {
      const price = res.data.quotes.USD.price;
      console.log("✅ SUCCESS - CoinPaprika working");
      console.log(`   ${res.data.name}: $${price.toLocaleString()}`);
    }
  } catch (e) {
    console.log(`❌ ERROR: ${e.message}`);
  }
}

async function runTests() {
  await testCoinGecko();
  await testCoinCap();
  await testCoinPaprika();
  console.log("\n🏁 Crypto Tests Complete");
}

runTests();
