const axios = require("axios");

const url = "https://youtube.com/watch?v=9IVTOh0TkkQ";
const apikey = "𝕊𝔸𝕄𝕂𝕀𝔼𝕃 𝔹𝕆𝕋";

const providers = [
  {
    name: "Keith (Current)",
    url: `https://apis-keith.vercel.app/download/dlmp3?url=${url}`,
  },
  { name: "Widipe", url: `https://widipe.com/download/ytdl?url=${url}` },
  { name: "BK9", url: `https://bk9.fun/download/youtube?url=${url}` },
  { name: "Vreden", url: `https://api.vreden.my.id/api/ytmp3?url=${url}` },
  {
    name: "Shizo",
    url: `https://api.shizo.top/api/download/ytmp3?apikey=${apikey}&url=${url}`,
  },
  {
    name: "GiftedTech",
    url: `https://api.giftedtech.my.id/api/download/ytmp3?apikey=gifted&url=${url}`,
  },
];

async function test() {
  for (const p of providers) {
    try {
      console.log(`Checking ${p.name}: ${p.url}`);
      const res = await axios.get(p.url, { timeout: 10000 });
      console.log(`Status: ${res.status}`);
      console.log(`Data: ${JSON.stringify(res.data).substring(0, 200)}`);
    } catch (e) {
      console.log(`Error ${p.name}: ${e.message}`);
      if (e.response) {
        console.log(`Error Body: ${JSON.stringify(e.response.data)}`);
      }
    }
    console.log("---");
  }
}

test();
