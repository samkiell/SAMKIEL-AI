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
    name: "BK9 Gemini",
    url: "https://bk9.fun/ai/gemini?q=say+hello",
    extract: (d) => d?.BK9 || d?.result || d?.response,
  },
  {
    name: "Neoxr GPT4",
    url: "https://api.neoxr.eu/api/gpt4?q=say+hello",
    extract: (d) => d?.result || d?.data,
  },
  {
    name: "Itzpire GPT",
    url: "https://itzpire.com/ai/gpt?model=gpt-4&q=say+hello",
    extract: (d) => d?.result || d?.data?.result,
  },
  {
    name: "Hercai",
    url: "https://hercai.onrender.com/v3/hercai?question=say+hello",
    extract: (d) => d?.reply || d?.message,
  },
  {
    name: "Paxsenix GPT4o",
    url: "https://api.paxsenix.biz.id/ai/gpt4o?text=say+hello",
    extract: (d) => d?.result || d?.message,
  },
  {
    name: "Vihanga ChatGPT",
    url: "https://vihangayt.me/ai/chatgpt?q=say+hello",
    extract: (d) => d?.data || d?.result,
  },
  {
    name: "BotCahx OpenAI",
    url: "https://api.botcahx.eu.org/api/search/openai-gpt?text=say+hello&apikey=free",
    extract: (d) => d?.result || d?.data,
  },
  {
    name: "Akuari GPT",
    url: "https://rest-api.akuari.my.id/ai/gpt?chat=say+hello",
    extract: (d) => d?.respon || d?.result,
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
        status: "✅ WORKING",
        response: result.substring(0, 80),
      };
    } else {
      return {
        name: api.name,
        status: "❌ NO_DATA",
        raw: JSON.stringify(data).substring(0, 80),
      };
    }
  } catch (error) {
    return {
      name: api.name,
      status: "❌ FAILED",
      error: error.message.substring(0, 50),
    };
  }
}

async function main() {
  console.log("=== Testing AI APIs ===\n");

  const working = [];

  for (const api of APIs) {
    process.stdout.write(`Testing: ${api.name}... `);
    const result = await testAPI(api);
    console.log(result.status);

    if (result.status.includes("WORKING")) {
      working.push({ name: api.name, url: api.url });
      console.log(`  ↳ ${result.response}`);
    } else if (result.error) {
      console.log(`  ↳ ${result.error}`);
    } else if (result.raw) {
      console.log(`  ↳ ${result.raw}`);
    }
  }

  console.log("\n=== Summary ===");
  console.log(`Working APIs: ${working.length}/${APIs.length}`);
  if (working.length > 0) {
    console.log("\nRecommended APIs to use:");
    working.forEach((api, i) => console.log(`  ${i + 1}. ${api.name}`));
  } else {
    console.log(
      "\n⚠️ All APIs are currently down or blocked from your server.",
    );
  }
}

main();
