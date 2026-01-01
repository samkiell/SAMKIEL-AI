const axios = require("axios");

const query = "who created twitter";

const endpoints = [
  {
    name: "Vreden Gemini",
    url: `https://api.vreden.my.id/api/ai/gemini?query=${encodeURIComponent(
      query
    )}`,
  },
  {
    name: "Vreden Llama",
    url: `https://api.vreden.my.id/api/ai/llama?query=${encodeURIComponent(
      query
    )}`,
  },
  {
    name: "Vreden GPT3",
    url: `https://api.vreden.my.id/api/ai/gpt3?query=${encodeURIComponent(
      query
    )}`,
  },
  {
    name: "Itzpire Llama",
    url: `https://itzpire.com/ai/llama-3-3?prompt=${encodeURIComponent(query)}`,
  },
  {
    name: "Itzpire Gemini",
    url: `https://itzpire.com/ai/gemini-pro?prompt=${encodeURIComponent(
      query
    )}`,
  },
];

async function probe() {
  for (const ep of endpoints) {
    try {
      console.log(`Testing ${ep.name}...`);
      const res = await axios.get(ep.url, { timeout: 10000 });
      console.log(`Status: ${res.status}`);
      console.log(`Data: ${JSON.stringify(res.data).substring(0, 200)}`);
    } catch (e) {
      console.log(`Error ${ep.name}: ${e.message}`);
    }
    console.log("---");
  }
}

probe();
