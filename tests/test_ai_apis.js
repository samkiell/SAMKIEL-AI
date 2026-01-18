const axios = require("axios");

const APIs = [
  {
    name: "Vreden DeepSeek",
    url: "https://api.vreden.my.id/api/ai/deepseek?text=say+hello",
    extract: (d) => d?.data?.result || d?.data || d?.result,
  },
  {
    name: "Siputzx Llama",
    url: "https://api.siputzx.my.id/api/ai/llama33?prompt=be+helpful&text=say+hello",
    extract: (d) => d?.data || d?.result,
  },
  {
    name: "Ryzendesu GPT",
    url: "https://api.ryzendesu.vip/api/ai/chatgpt?text=say+hello",
    extract: (d) => d?.result || d?.answer,
  },
  {
    name: "Gifted GPT",
    url: "https://api.giftedtech.my.id/api/ai/gpt?apikey=gifted&q=say+hello",
    extract: (d) => d?.result,
  },
  {
    name: "Dreaded GPT",
    url: "https://api.dreaded.site/api/chatgpt?text=say+hello",
    extract: (d) => d?.result?.prompt || d?.result,
  },
  {
    name: "Widipe OpenAI",
    url: "https://widipe.com/openai?text=say+hello",
    extract: (d) => d?.result || d?.data,
  },
  {
    name: "Darkness GPT",
    url: "https://api.darkness.my.id/api/chatgpt?text=say+hello",
    extract: (d) => d?.result,
  },
];

async function testAPI(api) {
  try {
    const { data } = await axios.get(api.url, {
      timeout: 15000,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0",
      },
    });

    const result = api.extract(data);
    if (result && typeof result === "string" && result.length > 2) {
      return {
        name: api.name,
        status: "✅ OK",
        response: result.substring(0, 50) + "...",
      };
    } else {
      return {
        name: api.name,
        status: "❌ NO_DATA",
        raw: JSON.stringify(data).substring(0, 100),
      };
    }
  } catch (error) {
    return { name: api.name, status: "❌ ERROR", error: error.message };
  }
}

async function main() {
  console.log("=== Testing AI APIs ===\n");

  for (const api of APIs) {
    console.log(`Testing: ${api.name}...`);
    const result = await testAPI(api);
    console.log(`  Status: ${result.status}`);
    if (result.response) console.log(`  Response: ${result.response}`);
    if (result.error) console.log(`  Error: ${result.error}`);
    if (result.raw) console.log(`  Raw: ${result.raw}`);
    console.log("");
  }

  console.log("=== Done ===");
}

main();
