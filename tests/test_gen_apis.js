const axios = require("axios");

const IMAGINE_APIS = [
  {
    name: "Pollinations (Flux)",
    url: "https://image.pollinations.ai/prompt/",
    type: "buffer",
  },
  {
    name: "Alakreb (Generate-Image)",
    url: "https://alakreb.vercel.app/api/ai/generate-image?q=",
    type: "json",
  },
];

const SORA_APIS = [
  {
    name: "Alakreb (Generate-Video)",
    url: "https://alakreb.vercel.app/api/ai/generate-video?q=",
    type: "json",
  },
];

async function testImageAPI(api) {
  const prompt = "a beautiful futuristic city with neon lights";
  const testUrl = api.url + encodeURIComponent(prompt);
  console.log(`Testing Image API: ${api.name}...`);
  try {
    const res = await axios.get(testUrl, {
      timeout: 30000,
      responseType: api.type === "buffer" ? "arraybuffer" : "json",
      headers: { "User-Agent": "Mozilla/5.0" },
    });

    if (api.type === "buffer") {
      if (res.status === 200 && res.data.length > 0) {
        console.log(
          `✅ ${api.name} WORKING (Buffer size: ${res.data.length} bytes)`,
        );
        return true;
      }
    } else {
      const data = res.data;
      const imgUrl = data?.url || data?.result || data?.image || data?.img;
      if (imgUrl && typeof imgUrl === "string" && imgUrl.startsWith("http")) {
        console.log(
          `✅ ${api.name} WORKING (URL: ${imgUrl.substring(0, 50)}...)`,
        );
        return true;
      }
      if (typeof data === "string" && data.startsWith("http")) {
        console.log(`✅ ${api.name} WORKING (Direct URL)`);
        return true;
      }
    }
    console.log(
      `❌ ${api.name} FAILED (Invalid response format or status ${res.status})`,
    );
    return false;
  } catch (e) {
    console.log(`❌ ${api.name} ERROR: ${e.message}`);
    return false;
  }
}

async function testVideoAPI(api) {
  const prompt = "a cat running in the grass";
  const testUrl = api.url + encodeURIComponent(prompt);
  console.log(`Testing Video API: ${api.name}...`);
  try {
    const res = await axios.get(testUrl, {
      timeout: 120000,
      headers: { "User-Agent": "Mozilla/5.0" },
    });

    const data = res.data;
    const videoUrl =
      data?.url ||
      data?.videoUrl ||
      data?.result ||
      data?.data?.videoUrl ||
      (typeof data === "string" && data.startsWith("http") ? data : null);

    if (videoUrl) {
      console.log(
        `✅ ${api.name} WORKING (URL: ${videoUrl.substring(0, 50)}...)`,
      );
      return true;
    }
    console.log(`❌ ${api.name} FAILED (No video URL found)`);
    return false;
  } catch (e) {
    console.log(`❌ ${api.name} ERROR: ${e.message}`);
    return false;
  }
}

async function run() {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  console.log("=== Testing Image APIs ===\n");
  for (const api of IMAGINE_APIS) {
    await testImageAPI(api);
  }

  console.log("\n=== Testing Video APIs ===\n");
  for (const api of SORA_APIS) {
    await testVideoAPI(api);
  }
}

run();
