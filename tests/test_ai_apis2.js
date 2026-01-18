const axios = require("axios");

// More AI APIs to test
const APIs = [
  // Free tier APIs
  {
    name: "Kobold AI",
    url: "https://lite.koboldai.net/api/v1/model",
    extract: (d) => d?.result,
  },
  {
    name: "OpenRouter Free",
    url: "https://openrouter.ai/api/v1/models",
    extract: (d) => d?.data?.[0]?.id,
  },
  {
    name: "Huggingface Inference",
    url: "https://api-inference.huggingface.co/models",
    extract: (d) => d,
  },

  // Alternative ChatGPT clones
  {
    name: "ChitChat API",
    url: "https://api.chitchat.gg/chat?message=hello",
    extract: (d) => d?.response,
  },
  {
    name: "You.com",
    url: "https://api.you.com/search?q=hello",
    extract: (d) => d?.answer,
  },

  // Indonesian APIs
  {
    name: "Zeks API GPT",
    url: "https://zfraa-api.vercel.app/api/gpt?text=hello",
    extract: (d) => d?.result,
  },
  {
    name: "NekoBot AI",
    url: "https://nekobot.xyz/api/chat?text=hello",
    extract: (d) => d?.response,
  },
  {
    name: "Kiyo API",
    url: "https://kiyo-api.vercel.app/gpt?text=hello",
    extract: (d) => d?.result,
  },
  {
    name: "Yori API",
    url: "https://yori-api.vercel.app/api/gpt4?text=hello",
    extract: (d) => d?.result,
  },
  {
    name: "Rynn API",
    url: "https://api.rynn.my.id/ai/gpt?text=hello",
    extract: (d) => d?.result,
  },

  // Other alternatives
  {
    name: "GPT4Free Alt",
    url: "https://gpt4free.io/chat/completions",
    extract: (d) => d?.choices?.[0]?.message,
  },
  {
    name: "FreeGPT",
    url: "https://api.freegpt.io/v1/chat/completions",
    extract: (d) => d?.choices?.[0],
  },
  {
    name: "ChatAnywhere",
    url: "https://api.chatanywhere.cn/v1/chat/completions",
    extract: (d) => d?.choices,
  },
];

async function testAPI(api) {
  try {
    const { data } = await axios.get(api.url, {
      timeout: 12000,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0",
        Accept: "application/json",
      },
    });

    const result = api.extract(data);
    if (result) {
      return {
        name: api.name,
        status: "✅ WORKING",
        response: JSON.stringify(result).substring(0, 60),
        url: api.url,
      };
    }
    return {
      name: api.name,
      status: "❌ NO_DATA",
      raw: JSON.stringify(data).substring(0, 60),
    };
  } catch (error) {
    return {
      name: api.name,
      status: "❌ FAILED",
      error: error.message.substring(0, 40),
    };
  }
}

async function main() {
  console.log("=== Extended AI API Test ===\n");

  const working = [];

  for (const api of APIs) {
    process.stdout.write(`Testing: ${api.name}... `);
    const result = await testAPI(api);
    console.log(result.status);

    if (result.status.includes("WORKING")) {
      working.push({ name: api.name, url: api.url });
      console.log(`    ${result.response}`);
    } else if (result.error) {
      console.log(`    ${result.error}`);
    }
  }

  console.log("\n=== Summary ===");
  console.log(`Working: ${working.length}/${APIs.length}`);
  working.forEach((api, i) =>
    console.log(`  ${i + 1}. ${api.name} - ${api.url}`),
  );
}

main();
