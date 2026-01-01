const fetch = require("node-fetch");

const query = "hello";
const apikey = "𝕊𝔸𝕄𝕂𝕀𝔼𝕃 𝔹𝕆𝕋";

const providers = [
  // Siputzx - confirmed structure
  "https://api.siputzx.my.id/api/ai/gemini?text=hello",
  "https://api.siputzx.my.id/api/ai/deepseek?text=hello",
  "https://api.siputzx.my.id/api/ai/gpt4?text=hello",
  "https://api.siputzx.my.id/api/ai/llama33?prompt=AI&text=hello",

  // Vreden - maybe different path
  "https://api.vreden.my.id/api/gpt4?query=hello",
  "https://api.vreden.my.id/api/gemini?query=hello",
  "https://api.vreden.my.id/api/deepseek?query=hello",

  // Shizo - trying without /ai/
  `https://api.shizo.top/api/gpt4?apikey=${encodeURIComponent(apikey)}&q=hello`,
  `https://api.shizo.top/api/gemini?apikey=${encodeURIComponent(
    apikey
  )}&q=hello`,
  `https://api.shizo.top/api/deepseek?apikey=${encodeURIComponent(
    apikey
  )}&q=hello`,

  // Popcat - sometimes works with owner
  "https://api.popcat.xyz/lyrics?song=hello", // Test if popcat is even up
  "https://api.popcat.xyz/chatbot?owner=Samkiel&botname=SamkielAI&msg=hello",
];

async function test() {
  for (const url of providers) {
    try {
      console.log(`Checking: ${url}`);
      const res = await fetch(url, { timeout: 10000 });
      console.log(`Status: ${res.status}`);
      const data = await res.json();
      console.log(`JSON: ${JSON.stringify(data).substring(0, 150)}`);
    } catch (e) {
      console.log(`Error: ${e.message}`);
    }
    console.log("---");
  }
}

test();
