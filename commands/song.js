const axios = require("axios");
const yts = require("yt-search");
const fs = require("fs");
const path = require("path");
const { loadPrefix } = require("../lib/prefix");

const AXIOS_DEFAULTS = {
  timeout: 60000,
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    Accept: "application/json, text/plain, */*",
  },
};

async function songCommand(sock, chatId, message) {
  try {
    const text =
      message.message?.conversation ||
      message.message?.extendedTextMessage?.text ||
      "";
    if (!text) {
      const currentPrefix = loadPrefix();
      const p = currentPrefix === "off" ? "" : currentPrefix;
      await sock.sendMessage(
        chatId,
        { text: `Usage: ${p}song <song name or YouTube link>` },
        { quoted: message },
      );
      return;
    }

    let video;
    if (text.includes("youtube.com") || text.includes("youtu.be")) {
      video = { url: text };
    } else {
      const search = await yts(text);
      if (!search || !search.videos.length) {
        await sock.sendMessage(
          chatId,
          { text: "The song no exist" },
          { quoted: message },
        );
        return;
      }
      video = search.videos[0];
    }

    // Inform user
    await sock.sendMessage(
      chatId,
      {
        image: { url: video.thumbnail },
        caption: `🎵 Downloading: *${video.title}*\n⏱ Duration: ${video.timestamp}`,
      },
      { quoted: message },
    );

    // Try Asitha primary, then Izumi, then Okatsu fallback
    // ------------------------------------------
    // ROBUST API CHAIN
    // ------------------------------------------
    let audioData;
    let success = false;
    const urlYt = video.url;

    // 1) David Cyril API (Primary)
    if (!success) {
      try {
        const res = await axios.get(
          `https://apis.davidcyril.name.ng/download/ytmp3?url=${encodeURIComponent(urlYt)}`,
        );
        if (res.data?.success && res.data?.result?.download_url) {
          audioData = {
            url: res.data.result.download_url,
            title: res.data.result.title,
          };
          success = true;
        }
      } catch (e) {
        console.log("David Cyril API failed:", e.message);
      }
    }

    // 2) Keith API
    if (!success) {
      try {
        const res = await axios.get(
          `https://keith-api.vercel.app/api/ytmp3?url=${encodeURIComponent(urlYt)}`,
        );
        if (res.data?.success && res.data?.downloadUrl) {
          audioData = {
            url: res.data.downloadUrl,
            title: res.data.title || "Audio",
          };
          success = true;
        }
      } catch (e) {
        console.log("Keith API failed:", e.message);
      }
    }

    // 3) Gifted API
    if (!success) {
      try {
        const res = await axios.get(
          `https://api.giftedtech.my.id/api/download/ytmp3?url=${encodeURIComponent(urlYt)}&apikey=gifted`,
        );
        if (res.data?.success && res.data?.result?.url) {
          audioData = {
            url: res.data.result.url,
            title: res.data.result.title,
          };
          success = true;
        }
      } catch (e) {
        console.log("Gifted API failed:", e.message);
      }
    }

    // 4) BK4 API
    if (!success) {
      try {
        const res = await axios.get(
          `https://bk4-api.vercel.app/download/yt?url=${encodeURIComponent(urlYt)}`,
        );
        if (res.data?.status && res.data?.data?.mp3) {
          audioData = { url: res.data.data.mp3, title: video.title };
          success = true;
        }
      } catch (e) {
        console.log("BK4 Mirror failed:", e.message);
      }
    }

    // 5) Widipe API
    if (!success) {
      try {
        const apiUrl = `https://widipe.com.pl/api/m/dl?url=${encodeURIComponent(urlYt)}`;
        const res = await axios.get(apiUrl, AXIOS_DEFAULTS);
        if (res.data?.status && res.data?.result?.dl) {
          audioData = { url: res.data.result.dl, title: res.data.result.title };
          success = true;
        }
      } catch (e) {
        console.log("Widipe API failed:", e.message);
      }
    }

    // 6) Cobalt API
    if (!success) {
      try {
        const res = await axios.post(
          "https://api.cobalt.tools/api/json",
          { url: urlYt, isAudioOnly: true },
          {
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
            },
          },
        );
        if (res.data?.url) {
          audioData = { url: res.data.url, title: video.title };
          success = true;
        }
      } catch (e) {
        console.log("Cobalt API failed:", e.message);
      }
    }

    if (!success || !audioData) {
      throw new Error("All APIs failed");
    }

    await sock.sendMessage(
      chatId,
      {
        audio: { url: audioData.download || audioData.dl || audioData.url },
        mimetype: "audio/mpeg",
        fileName: `${audioData.title || video.title || "song"}.mp3`,
        ptt: false,
      },
      { quoted: message },
    );
  } catch (err) {
    console.error("Song command error:", err);
    await sock.sendMessage(
      chatId,
      { text: "❌ Failed to download song." },
      { quoted: message },
    );
  }
}

module.exports = songCommand;
