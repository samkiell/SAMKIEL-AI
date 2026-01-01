const fetch = require("node-fetch");

const query = "hello";
const providers = [
  "https://sandipbaruwal.onrender.com/gpt?prompt=hello",
  "https://sandipbaruwal.onrender.com/gemini?prompt=hello",
  "https://sandipbaruwal.onrender.com/deepseek?prompt=hello",
  "https://api.siputzx.my.id/api/ai/gpt3?prompt=hello",
  "https://api.siputzx.my.id/api/ai/llama33?prompt=AI&text=hello",
];

async function test() {
  for (const url of providers) {
    try {
      console.log(`Checking: ${url}`);
      const res = await fetch(url, { timeout: 15000 });
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
