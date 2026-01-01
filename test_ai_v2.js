const axios = require("axios");
const fetch = require("node-fetch");

const query = "hello, tell me a short joke";

const providers = [
  {
    name: "Gifted GPT",
    url: `https://api.giftedtech.web.id/api/ai/ai?apikey=gifted&q=${encodeURIComponent(
      query
    )}`,
  },
  {
    name: "Gifted Blackbox",
    url: `https://api.giftedtech.web.id/api/ai/blackbox?apikey=gifted&q=${encodeURIComponent(
      query
    )}`,
  },
  {
    name: "Gifted GPT4o",
    url: `https://api.giftedtech.web.id/api/ai/gpt4o?apikey=gifted&q=${encodeURIComponent(
      query
    )}`,
  },
  {
    name: "Gemini Pro",
    url: `https://api.nyxs.pw/ai/gemini-pro?text=${encodeURIComponent(query)}`,
  },
  {
    name: "Popcat Chatbot",
    url: `https://api.popcat.xyz/chatbot?owner=Samkiel&botname=SamkielAI&msg=${encodeURIComponent(
      query
    )}`,
  },
  {
    name: "Siputzx Deepseek",
    url: `https://api.siputzx.my.id/api/ai/deepseek-r1?query=${encodeURIComponent(
      query
    )}`,
  },
  {
    name: "Vreden Deepseek",
    url: `https://api.vreden.my.id/api/ai/deepseek?query=${encodeURIComponent(
      query
    )}`,
  },
  {
    name: "BK9 Deepseek",
    url: `https://bk9.fun/ai/deepseek-r1?q=${encodeURIComponent(query)}`,
  },
];

async function testAll() {
  for (const provider of providers) {
    try {
      console.log(`Testing ${provider.name}: ${provider.url}`);
      const res = await fetch(provider.url, { timeout: 15000 });
      console.log(`Status: ${res.status}`);
      if (res.ok) {
        const data = await res.json();
        const answer =
          data.message ||
          data.result ||
          data.answer ||
          data.prompt ||
          data.response ||
          data.reply ||
          data.BK9 ||
          data.data;
        if (answer) {
          console.log(
            `Success! Snippet: ${
              typeof answer === "string"
                ? answer.substring(0, 100)
                : JSON.stringify(answer).substring(0, 100)
            }...`
          );
        } else {
          console.log(
            `Failure: No answer field in ${JSON.stringify(data).substring(
              0,
              50
            )}`
          );
        }
      } else {
        console.log(`Failure: Non-OK status.`);
      }
    } catch (e) {
      console.log(`Error: ${e.message}`);
    }
    console.log("-------------------");
  }
}

testAll();
