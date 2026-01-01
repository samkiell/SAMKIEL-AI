const axios = require("axios");

const query = "hello";
const apikey = "gifted";

const endpoints = [
  {
    name: "GiftedTech CoKe GPT3",
    url: `https://api.giftedtech.co.ke/api/ai/gpt3?q=${encodeURIComponent(
      query
    )}`,
  },
  {
    name: "GiftedTech CoKe Gemini",
    url: `https://api.giftedtech.co.ke/api/ai/gemini?q=${encodeURIComponent(
      query
    )}`,
  },
  {
    name: "GiftedTech CoKe Llama",
    url: `https://api.giftedtech.co.ke/api/ai/llama?q=${encodeURIComponent(
      query
    )}`,
  },
  {
    name: "GiftedTech CoKe DeepSeek",
    url: `https://api.giftedtech.co.ke/api/ai/deepseek?q=${encodeURIComponent(
      query
    )}`,
  },
  {
    name: "GiftedTech CoKe AI1",
    url: `https://api.giftedtech.co.ke/api/ai/ai1?q=${encodeURIComponent(
      query
    )}`,
  },
  {
    name: "GiftedTech WebId GPT3",
    url: `https://api.giftedtech.web.id/api/ai/gpt3?apikey=${apikey}&q=${encodeURIComponent(
      query
    )}`,
  },
  {
    name: "GiftedTech WebId Gemini",
    url: `https://api.giftedtech.web.id/api/ai/geminiai?apikey=${apikey}&q=${encodeURIComponent(
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
