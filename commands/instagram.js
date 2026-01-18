const { igdl } = require("ruhend-scraper");
const axios = require("axios");
const { loadPrefix } = require("../lib/prefix");

// Store processed message IDs to prevent duplicates
const processedMessages = new Set();

async function instagramCommand(sock, chatId, message) {
  try {
    // Check if message has already been processed (Deduplication)
    if (processedMessages.has(message.key.id)) return;
    processedMessages.add(message.key.id);
    setTimeout(() => processedMessages.delete(message.key.id), 5 * 60 * 1000);

    const text =
      message.message?.conversation ||
      message.message?.extendedTextMessage?.text;

    if (!text) {
      const p = loadPrefix() === "off" ? "" : loadPrefix();
      return await sock.sendMessage(chatId, {
        text: `Please provide an Instagram link.\nUsage: ${p}ig <link>`,
        ...global.channelInfo,
      });
    }

    const igPatterns = [
      /https?:\/\/(?:www\.)?instagram\.com\//,
      /https?:\/\/(?:www\.)?instagr\.am\//,
    ];
    const urlMatch =
      text.match(/https?:\/\/(?:www\.)?instagram\.com\/\S+/) ||
      text.match(/https?:\/\/(?:www\.)?instagr\.am\/\S+/);
    const url = urlMatch ? urlMatch[0] : null;

    if (!url) {
      return await sock.sendMessage(chatId, {
        text: "That is not a valid Instagram link.",
        ...global.channelInfo,
      });
    }

    await sock.sendMessage(chatId, { react: { text: "⏳", key: message.key } });

    let mediaData = [];
    let success = false;

    // --- ROBUST API CHAIN ---
    // 1. Kord API (New Primary)
    if (!success) {
      try {
        const { data } = await axios.get(
          `https://api.kord.live/api/instagram?url=${encodeURIComponent(url)}`,
        );
        if (data?.status && data.data && data.data.length > 0) {
          mediaData = data.data.map((item) => ({ url: item.url }));
          success = true;
        }
      } catch (e) {
        console.log("IG: Kord failed");
      }
    }

    // 2. Ruhend Scraper (Backup - Library)
    if (!success) {
      try {
        const data = await igdl(url);
        if (data && data.data && data.data.length > 0) {
          mediaData = data.data;
          success = true;
        }
      } catch (e) {
        console.log("IG: Ruhend failed");
      }
    }

    // 2. Siputzx API
    if (!success) {
      try {
        const { data } = await axios.get(
          `https://api.siputzx.my.id/api/d/igdl?url=${encodeURIComponent(url)}`,
        );
        if (data?.data && data.data.length > 0) {
          mediaData = data.data;
          success = true;
        }
      } catch (e) {
        console.log("IG: Siputzx failed");
      }
    }

    // 3. Gifted API
    if (!success) {
      try {
        const { data } = await axios.get(
          `https://api.giftedtech.my.id/api/download/instagram?apikey=gifted&url=${encodeURIComponent(url)}`,
        );
        if (data?.result && data.result.length > 0) {
          mediaData = data.result;
          success = true;
        }
      } catch (e) {
        console.log("IG: Gifted failed");
      }
    }

    // 4. Cobalt API
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
          mediaData = [{ url: res.data.url, type: "video" }]; // Assume video/image based on url
          success = true;
        } else if (res.data?.picker) {
          mediaData = res.data.picker.map((p) => ({
            url: p.url,
            type: p.type,
          }));
          success = true;
        }
      } catch (e) {
        console.log("IG: Cobalt failed");
      }
    }

    if (!success || mediaData.length === 0) {
      return await sock.sendMessage(chatId, {
        text: "❌ Failed to download Instagram media. All APIs busy.",
        ...global.channelInfo,
      });
    }

    // Send Media
    for (let i = 0; i < Math.min(10, mediaData.length); i++) {
      const media = mediaData[i];
      const mediaUrl = media.url;
      const isVideo =
        /\.(mp4|mov|avi|mkv|webm)$/i.test(mediaUrl) ||
        media.type === "video" ||
        url.includes("/reel/") ||
        url.includes("/tv/");

      if (isVideo) {
        await sock.sendMessage(
          chatId,
          {
            video: { url: mediaUrl },
            caption: "𝗗𝗢𝗪𝗡𝗟𝗢𝗔𝗗𝗘𝗗 𝗕𝗬 𝕊𝔸𝕄𝕂𝕀𝔼𝕃 𝔹𝕆𝕋",
            ...global.channelInfo,
          },
          { quoted: message },
        );
      } else {
        await sock.sendMessage(
          chatId,
          {
            image: { url: mediaUrl },
            caption: "𝗗𝗢𝗪𝗡𝗟𝗢𝗔𝗗𝗘𝗗 𝗕𝗬 𝕊𝔸𝕄𝕂𝕀𝔼𝕃 𝔹𝕆𝕋",
            ...global.channelInfo,
          },
          { quoted: message },
        );
      }
    }
  } catch (error) {
    console.error("Error in Instagram command:", error);
    await sock.sendMessage(chatId, {
      text: "An error occurred while processing.",
      ...global.channelInfo,
    });
  }
}

module.exports = instagramCommand;
