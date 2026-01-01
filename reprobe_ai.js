const fetch = require("node-fetch");

async function test() {
  const query = encodeURIComponent("test joke");
  const urls = [
    `https://api.siputzx.my.id/api/ai/llama33?prompt=AI&text=${query}`,
    `https://api.siputzx.my.id/api/ai/gpt3?prompt=${query}`,
    `https://api.siputzx.my.id/api/ai/gpt3?q=${query}`,
    `https://api.siputzx.my.id/api/ai/gpt3?query=${query}`,
    `https://api.siputzx.my.id/api/ai/gemini?text=${query}`,
  ];

  for (const url of urls) {
    try {
      console.log(`Probe: ${url}`);
      const res = await fetch(url);
      console.log(`Status: ${res.status}`);
      const body = await res.text();
      console.log(`Body: ${body.substring(0, 200)}`);
    } catch (e) {
      console.log(`Error: ${e.message}`);
    }
    console.log("---");
  }
}

test();
