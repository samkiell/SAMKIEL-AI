const fetch = require("node-fetch");

const query = "hello, tell me a short joke";
const apikey = "𝕊𝔸𝕄𝕂𝕀𝔼𝕃 𝔹𝕆𝕋";

const paths = [
  `https://api.shizo.top/api/ai/gpt4?apikey=${encodeURIComponent(
    apikey
  )}&q=${encodeURIComponent(query)}`,
  `https://api.shizo.top/api/ai/gemini?apikey=${encodeURIComponent(
    apikey
  )}&q=${encodeURIComponent(query)}`,
  `https://api.shizo.top/api/ai/deepseek?apikey=${encodeURIComponent(
    apikey
  )}&q=${encodeURIComponent(query)}`,
  `https://api.siputzx.my.id/api/ai/gpt4?query=${encodeURIComponent(query)}`,
  `https://api.siputzx.my.id/api/ai/gemini?query=${encodeURIComponent(query)}`,
  `https://api.siputzx.my.id/api/ai/deepseek?query=${encodeURIComponent(
    query
  )}`,
  `https://api.vreden.my.id/api/ai/gpt4?query=${encodeURIComponent(query)}`,
  `https://api.vreden.my.id/api/ai/gemini?query=${encodeURIComponent(query)}`,
  `https://api.vreden.my.id/api/ai/deepseek?query=${encodeURIComponent(query)}`,
  `https://api.giftedtech.my.id/api/ai/gpt4o?apikey=gifted&q=${encodeURIComponent(
    query
  )}`,
  `https://api.giftedtech.my.id/api/ai/deepseek?apikey=gifted&q=${encodeURIComponent(
    query
  )}`,
  `https://darkness.giftedtech.my.id/api/ai/gpt4?q=${encodeURIComponent(
    query
  )}`,
];

async function probe() {
  for (const url of paths) {
    try {
      console.log(`Probing: ${url}`);
      const res = await fetch(url, { timeout: 10000 });
      console.log(`Status: ${res.status}`);
      if (res.ok) {
        const data = await res.json();
        const answer =
          data.result ||
          data.message ||
          data.answer ||
          data.response ||
          data.reply ||
          data.data;
        if (answer) {
          console.log(`Bingo! Found Answer.`);
          console.log(
            `Answer prefix: ${
              typeof answer === "string"
                ? answer.substring(0, 50)
                : JSON.stringify(answer).substring(0, 50)
            }`
          );
        } else {
          console.log(
            `No Answer field in: ${JSON.stringify(data).substring(0, 100)}`
          );
        }
      }
    } catch (e) {
      console.log(`Error: ${e.message}`);
    }
    console.log("-------------------");
  }
}

probe();
