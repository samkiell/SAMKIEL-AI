/**
 * Test Suite for Weather Command
 * Run: node tests/test_weather.js
 */

const axios = require("axios");

const TIMEOUT = 10000;

console.log("🧪 Testing Weather Command APIs...\n");

async function testOpenMeteo() {
  console.log("--- Test 1: Open-Meteo API ---");
  try {
    // First geocode
    const geoUrl =
      "https://geocoding-api.open-meteo.com/v1/search?name=Lagos&count=1";
    const geoRes = await axios.get(geoUrl, { timeout: TIMEOUT });

    if (geoRes.data.results && geoRes.data.results.length > 0) {
      const loc = geoRes.data.results[0];
      console.log(`   Found: ${loc.name}, ${loc.country}`);

      // Get weather
      const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${loc.latitude}&longitude=${loc.longitude}&current=temperature_2m,relative_humidity_2m`;
      const weatherRes = await axios.get(weatherUrl, { timeout: TIMEOUT });

      if (weatherRes.data.current) {
        console.log("✅ SUCCESS - Open-Meteo working");
        console.log(
          `   Temperature: ${weatherRes.data.current.temperature_2m}°C`,
        );
        console.log(
          `   Humidity: ${weatherRes.data.current.relative_humidity_2m}%`,
        );
      }
    }
  } catch (e) {
    console.log(`❌ ERROR: ${e.message}`);
  }
}

async function testOpenWeatherMap() {
  console.log("\n--- Test 2: OpenWeatherMap API ---");
  try {
    const apiKey = "4902c0f2550f58298ad4146a92b65e10";
    const url = `https://api.openweathermap.org/data/2.5/weather?q=London&appid=${apiKey}&units=metric`;
    const res = await axios.get(url, { timeout: TIMEOUT });

    if (res.data.main) {
      console.log("✅ SUCCESS - OpenWeatherMap working");
      console.log(
        `   ${res.data.name}: ${res.data.main.temp}°C, ${res.data.weather[0].description}`,
      );
    }
  } catch (e) {
    console.log(`❌ ERROR: ${e.message}`);
  }
}

async function testWttrIn() {
  console.log("\n--- Test 3: wttr.in API ---");
  try {
    const url = "https://wttr.in/NewYork?format=j1";
    const res = await axios.get(url, { timeout: TIMEOUT });

    if (res.data.current_condition) {
      const current = res.data.current_condition[0];
      console.log("✅ SUCCESS - wttr.in working");
      console.log(
        `   Temperature: ${current.temp_C}°C, Feels like: ${current.FeelsLikeC}°C`,
      );
    }
  } catch (e) {
    console.log(`❌ ERROR: ${e.message}`);
  }
}

async function runTests() {
  await testOpenMeteo();
  await testOpenWeatherMap();
  await testWttrIn();
  console.log("\n🏁 Weather Tests Complete");
}

runTests();
