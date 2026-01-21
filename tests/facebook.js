const axios = require("axios");
const { loadPrefix } = require("../lib/prefix");
const { sendReaction } = require("../lib/reactions");

async function facebookCommand(sock, chatId, message) {
  try {
    const text =
      message.message?.conversation ||
      message.message?.extendedTextMessage?.text;
    const url = text.split(" ").slice(1).join(" ").trim();

    if (!url || (!url.includes("facebook.com") && !url.includes("fb.watch"))) {
      const p = loadPrefix() === "off" ? "" : loadPrefix();
      return await sock.sendMessage(chatId, {
        text: `Please provide a valid Facebook video URL.\nExample: ${p}fb <url>`,
        ...global.channelInfo,
      });
    }

    await sendReaction(sock, message, "🔄");

    let videoUrl = null;
    let title = "Facebook Video";
    let success = false;

    // --- ROBUST API CHAIN ---

    // 1. Siputzx API
    if (!success) {
      try {
        const { data } = await axios.get(
          `https://api.siputzx.my.id/api/d/facebook?url=${encodeURIComponent(url)}`,
        );
        if (data?.data && data.data.length > 0) {
          // Usually returns array of qualities. Pick HD or SD.
          const vid =
            data.data.find((v) => v.quality === "HD") ||
            data.data.find((v) => v.quality === "SD") ||
            data.data[0];
          if (vid && vid.url) {
            videoUrl = vid.url;
            title = "Facebook Video";
            success = true;
          }
        }
      } catch (e) {
        console.log("FB: Siputzx failed");
      }
    }

    // 2. Gifted API
    if (!success) {
      try {
        const { data } = await axios.get(
          `https://api.giftedtech.my.id/api/download/facebook?apikey=gifted&url=${encodeURIComponent(url)}`,
        );
        if (data?.result && data.result.length > 0) {
          const vid =
            data.result.find((v) => v.quality === "hd") ||
            data.result.find((v) => v.quality === "sd") ||
            data.result[0];
          if (vid && vid.url) {
            videoUrl = vid.url;
            success = true;
          }
        }
      } catch (e) {
        console.log("FB: Gifted failed");
      }
    }

    // 3. Widipe API
    if (!success) {
      try {
        const { data } = await axios.get(
          `https://widipe.com.pl/api/m/fb?url=${encodeURIComponent(url)}`,
        );
        if (data?.result && data.result.url) {
          videoUrl = data.result.url;
          success = true;
        }
      } catch (e) {
        console.log("FB: Widipe failed");
      }
    }

    // 4. Dreaded API (Legacy/Fallback)
    if (!success) {
      try {
        const { data } = await axios.get(
          `https://api.dreaded.site/api/facebook?url=${url}`,
        );
        if (data?.facebook?.sdVideo) {
          videoUrl = data.facebook.sdVideo;
          success = true;
        }
      } catch (e) {
        console.log("FB: Dreaded failed");
      }
    }

    // 5. Cobalt API
    if (!success) {
      try {
        const res = await axios.post(
          "https://api.cobalt.tools/api/json",
          { url: url },
          {
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
            },
          },
        );
        if (res.data?.url) {
          videoUrl = res.data.url;
          success = true;
        }
      } catch (e) {
        console.log("FB: Cobalt failed");
      }
    }

    if (!success || !videoUrl) {
      return await sock.sendMessage(chatId, {
        text: "❌ Failed to download Facebook video. All APIs busy.",
        ...global.channelInfo,
      });
    }

    // Send Video
    await sock.sendMessage(
      chatId,
      {
        video: { url: videoUrl },
        caption: `𝗗𝗢𝗪𝗡𝗟𝗢𝗔𝗗𝗘𝗗 𝗕𝗬 𝕊𝔸𝕄𝕂𝕀𝔼𝕃 𝔹𝕆𝕋`,
        ...global.channelInfo,
      },
      { quoted: message },
    );
  } catch (error) {
    console.error("Error in Facebook command:", error);
    await sock.sendMessage(chatId, {
      text: "An error occurred.",
      ...global.channelInfo,
    });
  }
}

module.exports = facebookCommand;
