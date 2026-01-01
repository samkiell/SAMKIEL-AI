const axios = require("axios");
const fetch = require("node-fetch");

const query = "hello, tell me a short joke";

const gptApis = [
  `https://widipe.com/openai?text=${encodeURIComponent(query)}`,
  `https://bk9.fun/ai/gpt4?q=${encodeURIComponent(query)}`,
  `https://api.dark-yasiya-api.vercel.app/chat/gpt?query=${encodeURIComponent(
    query
  )}`,
  `https://api.popcat.xyz/chatbot?owner=Samkiel&botname=SamkielAI&msg=${encodeURIComponent(
    query
  )}`,
  `https://api.giftedtech.web.id/api/ai/ai?apikey=gifted&q=${encodeURIComponent(
    query
  )}`,
  `https://api.giftedtech.web.id/api/ai/blackbox?apikey=gifted&q=${encodeURIComponent(
    query
  )}`,
  `https://api.giftedtech.web.id/api/ai/gpt4o?apikey=gifted&q=${encodeURIComponent(
    query
  )}`,
];

const geminiApis = [
  `https://widipe.com/gemini?text=${encodeURIComponent(query)}`,
  `https://api.nyxs.pw/ai/gemini-pro?text=${encodeURIComponent(query)}`,
  `https://bk9.fun/ai/gemini?q=${encodeURIComponent(query)}`,
  `https://api.giftedtech.my.id/api/ai/geminiai?apikey=gifted&q=${encodeURIComponent(
    query
  )}`,
];

const deepseekApis = [
  `https://bk9.fun/ai/deepseek-r1?q=${encodeURIComponent(query)}`,
  `https://api.giftedtech.my.id/api/ai/deepseek?apikey=gifted&q=${encodeURIComponent(
    query
  )}`,
  `https://api.siputzx.my.id/api/ai/deepseek-r1?query=${encodeURIComponent(
    query
  )}`,
  `https://api.vreden.my.id/api/ai/deepseek?query=${encodeURIComponent(query)}`,
];

async function testApis(name, apis) {
  console.log(`\n--- Testing ${name} APIs ---`);
  for (const api of apis) {
    try {
      console.log(`Testing: ${api}`);
      const res = await fetch(api, { timeout: 10000 });
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
            `Success! Response snippet: ${
              typeof answer === "string"
                ? answer.substring(0, 100)
                : JSON.stringify(answer).substring(0, 100)
            }...`
          );
        } else {
          console.log(`Failure: No response field found in JSON.`);
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

async function startTest() {
  await testApis("GPT", gptApis);
  await testApis("Gemini", geminiApis);
  await testApis("DeepSeek", deepseekApis);
}

startTest();
