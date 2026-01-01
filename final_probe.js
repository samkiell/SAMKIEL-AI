const fetch = require("node-fetch");

const query = "hello";
const providers = [
  "https://api.siputzx.my.id/api/ai/gemini-pro?text=hello",
  "https://api.siputzx.my.id/api/ai/deepseek-r1?prompt=hello",
  "https://api.siputzx.my.id/api/ai/deepseek-v3?prompt=hello",
  "https://sandipbaruwal.onrender.com/gemini?prompt=hello",
  "https://sandipbaruwal.onrender.com/gpt?prompt=hello",
];

async function test() {
  for (const url of providers) {
    try {
      console.log(`Checking: ${url}`);
      const res = await fetch(url, { timeout: 10000 });
      if (res.ok) {
        const data = await res.json();
        console.log(
          `Success ${
            url.includes("gemini") ? "Gemini" : "DeepSeek"
          }: ${JSON.stringify(data).substring(0, 100)}`
        );
      } else {
        console.log(`Failed: ${res.status}`);
      }
    } catch (e) {}
  }
}
test();
