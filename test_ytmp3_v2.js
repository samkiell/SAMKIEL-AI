const axios = require("axios");

const url = "https://youtube.com/watch?v=9IVTOh0TkkQ";

const providers = [
  {
    name: "GiftedTech CoKe",
    url: `https://api.giftedtech.co.ke/api/download/ytmp3?apikey=gifted&url=${url}`,
  },
  {
    name: "Siputzx",
    url: `https://api.siputzx.my.id/api/download/ytmp3?url=${url}`,
  },
  { name: "Itzpire", url: `https://itzpire.com/download/ytmp3?url=${url}` },
  {
    name: "Sandip",
    url: `https://sandipbaruwal.onrender.com/download/ytmp3?url=${url}`,
  },
];

async function test() {
  for (const p of providers) {
    try {
      console.log(`Checking ${p.name}: ${p.url}`);
      const res = await axios.get(p.url, { timeout: 15000 });
      console.log(`Status: ${res.status}`);
      console.log(`Data: ${JSON.stringify(res.data).substring(0, 200)}`);
    } catch (e) {
      console.log(`Error ${p.name}: ${e.message}`);
    }
    console.log("---");
  }
}

test();
