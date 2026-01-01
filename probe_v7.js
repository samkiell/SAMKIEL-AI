const fetch = require("node-fetch");

const query = "hello";
const providers = [
  "https://api.yanzbotz.my.id/api/ai/gpt4?query=hello",
  "https://api.yanzbotz.my.id/api/ai/gemini?query=hello",
  "https://api.krizyn.biz.id/api/ai/gpt4?query=hello",
  "https://api.krizyn.biz.id/api/ai/gemini?query=hello",
  "https://api.krizyn.biz.id/api/ai/deepseek?query=hello",
  "https://api.siputzx.my.id/api/ai/llama33?prompt=Be+a+helpful+AI&text=hello",
  "https://api.siputzx.my.id/api/ai/gpt3?text=hello",
  "https://api.vreden.my.id/api/ai/llama3?query=hello",
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
