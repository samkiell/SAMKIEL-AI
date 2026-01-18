const axios = require("axios");

// Extended list of AI APIs to test
const APIs = [
  // GPT/ChatGPT variants
  {
    name: "Nexra GPT",
    url: "https://nexra.aryahcr.cc/api/chat/gpt?model=gpt-4&message=hello",
    extract: (d) => d?.gpt || d?.message,
  },
  {
    name: "FGMods AI",
    url: "https://api-fgmods.ddns.net/api/ai/chatgpt?text=hello",
    extract: (d) => d?.result,
  },
  {
    name: "Zenith AI",
    url: "https://api.zenith-xd.xyz/api/gpt4?text=hello",
    extract: (d) => d?.result,
  },
  {
    name: "Yanzbotz GPT",
    url: "https://api.yanzbotz.my.id/api/ai/gpt4?text=hello&apikey=yanz",
    extract: (d) => d?.result,
  },
  {
    name: "DGX GPT",
    url: "https://aemt.me/gpt4?text=hello",
    extract: (d) => d?.result,
  },

  // DeepSeek variants
  {
    name: "Nexra DeepSeek",
    url: "https://nexra.aryahcr.cc/api/chat/gpt?model=deepseek&message=hello",
    extract: (d) => d?.gpt || d?.message,
  },

  // Llama variants
  {
    name: "Nexra Llama",
    url: "https://nexra.aryahcr.cc/api/chat/gpt?model=llama-3.1&message=hello",
    extract: (d) => d?.gpt || d?.message,
  },

  // Claude variants
  {
    name: "Nexra Claude",
    url: "https://nexra.aryahcr.cc/api/chat/gpt?model=claude&message=hello",
    extract: (d) => d?.gpt || d?.message,
  },

  // Misc AI APIs
  {
    name: "Xteam AI",
    url: "https://api.xteam.xyz/chatgpt?text=hello&apikey=d90a9e986e18778b",
    extract: (d) => d?.result,
  },
  {
    name: "Lolhuman AI",
    url: "https://api.lolhuman.xyz/api/gpt4?apikey=85faf717d0545d14074659ad&text=hello",
    extract: (d) => d?.result,
  },
  {
    name: "Popcat AI",
    url: "https://api.popcat.xyz/ai?q=hello",
    extract: (d) => d?.response || d?.text,
  },
  {
    name: "Brainshop AI",
    url: "http://api.brainshop.ai/get?bid=178433&key=3vz6Xvw1LBQfLQAR&uid=test&msg=hello",
    extract: (d) => d?.cnt,
  },

  // New alternatives
  {
    name: "Blackbox AI",
    url: "https://api.blackbox.ai/api/chat?message=hello",
    extract: (d) => d?.response || d?.reply,
  },
  {
    name: "GPT4Free Nexra",
    url: "https://nexra.aryahcr.cc/api/chat/complements?message=hello&model=gpt-4",
    extract: (d) => d?.message || d?.gpt,
  },
];

// Tempmail APIs to test
const TEMPMAIL_APIS = [
  {
    name: "Mailtm",
    url: "https://api.mail.tm/domains",
    extract: (d) => d?.["hydra:member"]?.[0]?.domain,
  },
  {
    name: "Guerrillamail",
    url: "https://api.guerrillamail.com/ajax.php?f=get_email_address",
    extract: (d) => d?.email_addr,
  },
  {
    name: "Tempmail.lol",
    url: "https://api.tempmail.lol/generate",
    extract: (d) => d?.address,
  },
  {
    name: "Dropmail",
    url: "https://dropmail.me/api/graphql/web-test-wgq2r?query={introduceSession{id,expiresAt,addresses{address}}}",
    extract: (d) => d?.data?.introduceSession?.addresses?.[0]?.address,
  },
];

async function testAPI(api, type = "AI") {
  try {
    const config = {
      timeout: 15000,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
        Accept: "application/json",
      },
    };

    let data;
    if (api.url.includes("graphql")) {
      // GraphQL request
      const response = await axios.get(api.url, config);
      data = response.data;
    } else {
      const response = await axios.get(api.url, config);
      data = response.data;
    }

    const result = api.extract(data);
    if (result && (typeof result === "string" ? result.length > 1 : true)) {
      return {
        name: api.name,
        status: "✅ WORKING",
        response: String(result).substring(0, 60),
        url: api.url,
      };
    } else {
      return {
        name: api.name,
        status: "❌ NO_DATA",
        raw: JSON.stringify(data).substring(0, 60),
      };
    }
  } catch (error) {
    return {
      name: api.name,
      status: "❌ FAILED",
      error: error.message.substring(0, 40),
    };
  }
}

async function main() {
  console.log("========================================");
  console.log("  SAMKIEL BOT - API Availability Test");
  console.log("========================================\n");

  // Test AI APIs
  console.log("--- Testing AI APIs ---\n");
  const workingAI = [];

  for (const api of APIs) {
    process.stdout.write(`[AI] ${api.name}... `);
    const result = await testAPI(api, "AI");
    console.log(result.status);

    if (result.status.includes("WORKING")) {
      workingAI.push({ name: api.name, url: api.url });
      console.log(`    Response: ${result.response}`);
    } else if (result.error) {
      console.log(`    Error: ${result.error}`);
    }
  }

  // Test Tempmail APIs
  console.log("\n--- Testing Tempmail APIs ---\n");
  const workingTempmail = [];

  for (const api of TEMPMAIL_APIS) {
    process.stdout.write(`[MAIL] ${api.name}... `);
    const result = await testAPI(api, "MAIL");
    console.log(result.status);

    if (result.status.includes("WORKING")) {
      workingTempmail.push({ name: api.name, url: api.url });
      console.log(`    Response: ${result.response}`);
    } else if (result.error) {
      console.log(`    Error: ${result.error}`);
    }
  }

  // Summary
  console.log("\n========================================");
  console.log("  SUMMARY");
  console.log("========================================\n");

  console.log(`✅ Working AI APIs: ${workingAI.length}/${APIs.length}`);
  if (workingAI.length > 0) {
    workingAI.forEach((api, i) => console.log(`   ${i + 1}. ${api.name}`));
  }

  console.log(
    `\n✅ Working Tempmail APIs: ${workingTempmail.length}/${TEMPMAIL_APIS.length}`,
  );
  if (workingTempmail.length > 0) {
    workingTempmail.forEach((api, i) =>
      console.log(`   ${i + 1}. ${api.name}`),
    );
  }

  if (workingAI.length === 0 && workingTempmail.length === 0) {
    console.log("\n⚠️ All APIs are currently down or blocked.");
  }

  console.log("\n========================================");
}

main();
