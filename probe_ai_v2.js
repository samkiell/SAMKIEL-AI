const fetch = require("node-fetch");

const query = "test";
const providers = [
  // Siputzx variations
  "https://api.siputzx.my.id/api/ai/gpt4o?query=",
  "https://api.siputzx.my.id/api/ai/gemini?query=",
  "https://api.siputzx.my.id/api/ai/deepseek-r1?query=",
  "https://api.siputzx.my.id/api/ai/deepseek?query=",
  "https://api.siputzx.my.id/api/ai/chatgpt?query=",
  "https://api.siputzx.my.id/api/tools/ai?query=",

  // Vreden variations
  "https://api.vreden.my.id/api/ai/gpt4?query=",
  "https://api.vreden.my.id/api/ai/gemini?query=",
  "https://api.vreden.my.id/api/ai/deepseek?query=",
  "https://api.vreden.my.id/api/ai/deepseek-r1?query=",

  // Shizo variations
  "https://api.shizo.top/api/ai/gpt4?apikey=𝕊𝔸𝕄𝕂𝕀𝔼𝕃 𝔹𝕆𝕋&q=",
  "https://api.shizo.top/api/ai/gemini?apikey=𝕊𝔸𝕄𝕂𝕀𝔼𝕃 𝔹𝕆𝕋&q=",
  "https://api.shizo.top/api/ai/deepseek?apikey=𝕊𝔸𝕄𝕂𝕀𝔼𝕃 𝔹𝕆𝕋&q=",

  // Popcat (often works)
  "https://api.popcat.xyz/chatbot?owner=Samkiel&botname=SamkielAI&msg=",

  // Giftedtech (.co.ke is the new one from the movie request)
  "https://movieapi.giftedtech.co.ke/api/ai/gpt4?q=",
  "https://api.giftedtech.co.ke/api/ai/gpt4?q=",
  "https://api.giftedtech.co.ke/api/ai/gemini?q=",
  "https://api.giftedtech.co.ke/api/ai/deepseek?q=",

  // Others
  "https://api.maher-zubair.tech/ai/chatgpt?q=",
  "https://api.maher-zubair.tech/ai/gemini?q=",
  "https://api.maher-zubair.tech/ai/deepseek?q=",
];

async function test() {
  for (const url of providers) {
    const fullUrl = url + encodeURIComponent(query);
    try {
      console.log(`Checking: ${fullUrl}`);
      const res = await fetch(fullUrl, { timeout: 8000 });
      console.log(`Status: ${res.status}`);
      if (res.ok) {
        const data = await res.json();
        console.log(`JSON: ${JSON.stringify(data).substring(0, 150)}`);
      }
    } catch (e) {
      console.log(`Error: ${e.message}`);
    }
    console.log("---");
  }
}

test();
