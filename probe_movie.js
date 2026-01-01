const axios = require("axios");

const movieQuery = "avengers";

const movieEndpoints = [
  {
    name: "Vreden Movie",
    url: `https://api.vreden.my.id/api/movie?query=${encodeURIComponent(
      movieQuery
    )}`,
  },
  {
    name: "Siputzx Movie",
    url: `https://api.siputzx.my.id/api/movie?query=${encodeURIComponent(
      movieQuery
    )}`,
  },
  {
    name: "Nyxs Movie",
    url: `https://api.nyxs.pw/movie/search?q=${encodeURIComponent(movieQuery)}`,
  },
];

async function probe() {
  for (const ep of movieEndpoints) {
    try {
      console.log(`Testing ${ep.name}...`);
      const res = await axios.get(ep.url, { timeout: 10000 });
      console.log(`Status: ${res.status}`);
      console.log(`Data: ${JSON.stringify(res.data).substring(0, 300)}`);
    } catch (e) {
      console.log(`Error ${ep.name}: ${e.message}`);
    }
    console.log("---");
  }
}

probe();
