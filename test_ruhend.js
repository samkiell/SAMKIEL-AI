const { ytmp3, ytmp4 } = require("ruhend-scraper");

const url = "https://youtube.com/watch?v=9IVTOh0TkkQ";

async function test() {
  try {
    console.log("Testing ytmp3...");
    const data3 = await ytmp3(url).catch((e) => {
      console.log("ytmp3 error:", e.message);
      return null;
    });
    console.log("ytmp3 result:", JSON.stringify(data3).substring(0, 500));

    console.log("\nTesting ytmp4...");
    const data4 = await ytmp4(url).catch((e) => {
      console.log("ytmp4 error:", e.message);
      return null;
    });
    console.log("ytmp4 result:", JSON.stringify(data4).substring(0, 500));
  } catch (e) {
    console.log("Critical error:", e.message);
  }
}

test();
