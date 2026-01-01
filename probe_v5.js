const fetch = require("node-fetch");

const query = "hello";
const providers = [
  "https://itzpire.com/ai/gpt-4?q=hello",
  "https://itzpire.com/ai/gemini-ai?q=hello",
  "https://itzpire.com/ai/deepseek?q=hello",
  "https://itzpire.com/ai/llama-3?q=hello",
  "https://api.maher-zubair.tech/ai/chatgpt?q=hello",
  "https://api.maher-zubair.tech/ai/gemini?q=hello",
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
        console.log(
          `Error Body: ${await res.text().then((t) => t.substring(0, 100))}`
        );
      }
    } catch (e) {
      console.log(`Error: ${e.message}`);
    }
    console.log("---");
  }
}

test();
