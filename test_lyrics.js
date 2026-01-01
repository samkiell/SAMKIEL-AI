const fetch = require("node-fetch");

const songTitle = "Believer Imagine Dragons";
const providers = [
  `https://bk9.fun/ai/gpt4?q=${encodeURIComponent(`lyrics for ${songTitle}`)}`,
  `https://widipe.com/openai?text=${encodeURIComponent(
    `lyrics for ${songTitle} by song name/artist`
  )}`,
  `https://api.dark-yasiya-api.vercel.app/chat/gpt?query=${encodeURIComponent(
    `lyrics for ${songTitle}`
  )}`,
  `https://api.popcat.xyz/chatbot?owner=Samkiel&botname=SamkielAI&msg=${encodeURIComponent(
    `lyrics for ${songTitle}`
  )}`,
];

async function testLyrics() {
  for (const apiUrl of providers) {
    try {
      console.log(`Testing: ${apiUrl}`);
      const res = await fetch(apiUrl);
      console.log(`Status: ${res.status}`);
      if (res.ok) {
        const data = await res.json();
        const content =
          data.BK9 || data.result || data.message || data.answer || data.reply;
        console.log(`Content length: ${content ? content.length : 0}`);
        if (content && content.length > 50) {
          console.log(
            `Success: Found lyrics snippet: ${content.substring(0, 100)}...`
          );
        } else {
          console.log(`Failure: Content too short or missing.`);
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

testLyrics();
