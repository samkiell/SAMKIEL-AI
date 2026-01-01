const fetch = require("node-fetch");

const songTitle = "Believer Imagine Dragons";
const providers = [
  `https://lyrist.vercel.app/api/${encodeURIComponent(songTitle)}`,
  `https://api.shizo.top/api/texts/lyrics?title=${encodeURIComponent(
    songTitle
  )}&apikey=𝕊𝔸𝕄𝕂𝕀𝔼𝕃 𝔹𝕆𝕋`,
  `https://api.siputzx.my.id/api/tools/lyrics?query=${encodeURIComponent(
    songTitle
  )}`,
  `https://api.vreden.my.id/api/lyrics?query=${encodeURIComponent(songTitle)}`,
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
          data.lyrics ||
          (data.result && data.result.lyrics) ||
          (data.data && data.data.lyrics) ||
          data.result;
        console.log(
          `Content length: ${
            content
              ? typeof content === "string"
                ? content.length
                : JSON.stringify(content).length
              : 0
          }`
        );
        if (
          content &&
          (typeof content === "string" ? content.length > 50 : true)
        ) {
          console.log(`Success!`);
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
