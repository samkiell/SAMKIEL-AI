const axios = require("axios");

const query = "who created twitter";
const apikey = "𝕊𝔸𝕄𝕂𝕀𝔼𝕃 𝔹𝕆𝕋";

const endpoints = [
  {
    name: "DeepSeek Shizo",
    url: `https://api.shizo.top/api/ai/deepseek?apikey=${apikey}&q=${encodeURIComponent(
      query
    )}`,
  },
  {
    name: "DeepSeek Siputzx",
    url: `https://api.siputzx.my.id/api/ai/deepseek?text=${encodeURIComponent(
      query
    )}`,
  },
  {
    name: "Llama33 Siputzx (DeepSeek Prompt)",
    url: `https://api.siputzx.my.id/api/ai/llama33?prompt=You+are+DeepSeek+R1+thinking+AI&text=${encodeURIComponent(
      query
    )}`,
  },
  {
    name: "DeepSeek Gifted",
    url: `https://api.giftedtech.web.id/api/ai/deepseek?apikey=gifted&q=${encodeURIComponent(
      query
    )}`,
  },
  {
    name: "Gemini Siputzx",
    url: `https://api.siputzx.my.id/api/ai/gemini?text=${encodeURIComponent(
      query
    )}`,
  },
  {
    name: "GPT4 Siputzx",
    url: `https://api.siputzx.my.id/api/ai/gpt4?text=${encodeURIComponent(
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
      if (e.response) {
        console.log(`Error Status: ${e.response.status}`);
        console.log(`Error Body: ${String(e.response.data).substring(0, 200)}`);
      }
    }
    console.log("---");
  }
}

probe();
