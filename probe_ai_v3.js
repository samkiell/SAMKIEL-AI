const fetch = require("node-fetch");

const query = "hello";
const providers = [
  // Siputzx - trial with prompt/text/content
  "https://api.siputzx.my.id/api/ai/llama33?prompt=You+are+AI&text=hello",
  "https://api.siputzx.my.id/api/ai/chatgpt?prompt=hello",
  "https://api.siputzx.my.id/api/ai/gemini?prompt=hello",
  "https://api.siputzx.my.id/api/ai/deepseek-r1?prompt=hello",

  // Vreden - check if /api/ai/ exists
  "https://api.vreden.my.id/api/ai/chatgpt?query=hello",
  "https://api.vreden.my.id/api/ai/gemini?query=hello",
  "https://api.vreden.my.id/api/ai/deepseek?query=hello",

  // Shizo - check if /api/... or /... exists
  "https://api.shizo.top/api/ai/chatgpt?apikey=𝕊𝔸𝕄𝕂𝕀𝔼𝕃 𝔹𝕆𝕋&q=hello",
  "https://api.shizo.top/api/ai/gemini?apikey=𝕊𝔸𝕄𝕂𝕀𝔼𝕃 𝔹𝕆𝕋&q=hello",

  // Giftedtech - co.ke
  "https://api.giftedtech.co.ke/api/ai/gpt4?q=hello",
  "https://api.giftedtech.co.ke/api/ai/gemini?q=hello",
];

async function test() {
  for (const url of providers) {
    try {
      console.log(`Checking: ${url}`);
      const res = await fetch(url, { timeout: 10000 });
      console.log(`Status: ${res.status}`);
      if (res.ok) {
        const data = await res.json();
        console.log(`JSON: ${JSON.stringify(data).substring(0, 150)}`);
      } else {
        const text = await res.text();
        console.log(`Error Body: ${text.substring(0, 100)}`);
      }
    } catch (e) {
      console.log(`Error: ${e.message}`);
    }
    console.log("---");
  }
}

test();
