const axios = require("axios");

// Final batch of AI APIs - focus on stable ones
const APIs = [
  // POST-based APIs (might work better)
  {
    name: "OpenRouter Chat",
    url: "https://openrouter.ai/api/v1/chat/completions",
    method: "POST",
    body: {
      model: "openai/gpt-3.5-turbo",
      messages: [{ role: "user", content: "hello" }],
    },
    extract: (d) => d?.choices?.[0]?.message?.content,
  },

  // Simple GET APIs
  {
    name: "API Ninja Facts",
    url: "https://api.api-ninjas.com/v1/facts",
    extract: (d) => d?.[0]?.fact,
  },
  {
    name: "Advice Slip",
    url: "https://api.adviceslip.com/advice",
    extract: (d) => d?.slip?.advice,
  },
  {
    name: "Affirmations",
    url: "https://www.affirmations.dev/",
    extract: (d) => d?.affirmation,
  },
  {
    name: "Random Quote",
    url: "https://api.quotable.io/random",
    extract: (d) => d?.content,
  },
  {
    name: "Useless Facts",
    url: "https://uselessfacts.jsph.pl/api/v2/facts/random",
    extract: (d) => d?.text,
  },
  {
    name: "Trivia",
    url: "https://opentdb.com/api.php?amount=1&type=boolean",
    extract: (d) => d?.results?.[0]?.question,
  },

  // Groq (free tier)
  {
    name: "Groq API",
    url: "https://api.groq.com/openai/v1/chat/completions",
    method: "POST",
    body: {
      model: "mixtral-8x7b-32768",
      messages: [{ role: "user", content: "hello" }],
    },
    extract: (d) => d?.choices?.[0]?.message?.content,
  },

  // Together AI
  {
    name: "Together AI",
    url: "https://api.together.xyz/inference",
    method: "POST",
    body: { model: "togethercomputer/llama-2-7b-chat", prompt: "hello" },
    extract: (d) => d?.output?.choices?.[0]?.text,
  },
];

async function testAPI(api) {
  try {
    const config = {
      timeout: 15000,
      headers: {
        "User-Agent": "Mozilla/5.0 Chrome/120.0.0.0",
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    };

    let data;
    if (api.method === "POST") {
      const res = await axios.post(api.url, api.body, config);
      data = res.data;
    } else {
      const res = await axios.get(api.url, config);
      data = res.data;
    }

    const result = api.extract(data);
    if (result && String(result).length > 1) {
      return {
        name: api.name,
        status: "✅ WORKING",
        response: String(result).substring(0, 80),
        url: api.url,
      };
    }
    return {
      name: api.name,
      status: "❌ NO_DATA",
      raw: JSON.stringify(data).substring(0, 80),
    };
  } catch (error) {
    const status = error.response?.status || "";
    return {
      name: api.name,
      status: "❌ FAILED",
      error: `${status} ${error.message.substring(0, 30)}`,
    };
  }
}

async function main() {
  console.log("=== Final AI API Test ===\n");

  const working = [];

  for (const api of APIs) {
    process.stdout.write(`Testing: ${api.name}... `);
    const result = await testAPI(api);
    console.log(result.status);

    if (result.status.includes("WORKING")) {
      working.push({ name: api.name, url: api.url });
      console.log(`    Response: ${result.response}`);
    } else {
      console.log(`    ${result.error || result.raw || ""}`);
    }
  }

  console.log("\n=== WORKING APIs ===");
  if (working.length > 0) {
    working.forEach((api, i) => console.log(`${i + 1}. ${api.name}`));
  } else {
    console.log("None found :(");
  }
}

main();
