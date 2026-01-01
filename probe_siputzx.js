const fetch = require("node-fetch");

const query = "hello";
const providers = [
  "https://api.siputzx.my.id/api/ai/gemini?text=hello",
  "https://api.siputzx.my.id/api/ai/deepseek?text=hello",
  "https://api.siputzx.my.id/api/ai/gpt4?text=hello",
  "https://api.siputzx.my.id/api/ai/llama33?prompt=AI&text=hello",
];

async function test() {
  for (const url of providers) {
    try {
      console.log(`Checking: ${url}`);
      const res = await fetch(url, { timeout: 10000 });
      console.log(`Status: ${res.status}`);
      const data = await res.json();
      console.log(`JSON: ${JSON.stringify(data)}`);
    } catch (e) {
      console.log(`Error: ${e.message}`);
    }
    console.log("---");
  }
}

test();
