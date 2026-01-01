const fetch = require("node-fetch");

const query = "hello";
const providers = [
  "https://api.siputzx.my.id/api/ai/llama33?prompt=AI&text=hello",
  "https://api.siputzx.my.id/api/ai/gpt4o?text=hello",
  "https://api.vreden.my.id/api/gpt4?query=hello",
  "https://api.vreden.my.id/api/gemini?query=hello",
  "https://api.vreden.my.id/api/deepseek?query=hello",
  "https://api.vreden.my.id/api/ai/deepseek-r1?text=hello",
  "https://itzpire.com/ai/gpt-4?q=hello",
  "https://restapi.apizzy.com/ai/gpt4?query=hello",
  "https://restapi.apizzy.com/ai/gemini-ai?query=hello",
  "https://restapi.apizzy.com/api/deepseek?query=hello",
];

async function test() {
  for (const url of providers) {
    try {
      console.log(`Checking: ${url}`);
      const res = await fetch(url, { timeout: 8000 });
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
