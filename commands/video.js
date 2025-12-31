const axios = require("axios");
const yts = require("yt-search");

const AXIOS_DEFAULTS = {
  timeout: 60000,
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    Accept: "application/json, text/plain, */*",
  },
};

// Provider Functions
async function getWidipeVideo(url) {
  const res = await axios.get(
    `https://widipe.com/download/ytdl?url=${encodeURIComponent(url)}`,
    AXIOS_DEFAULTS
  );
  if (res.data?.result?.mp4) {
    return {
      download: res.data.result.mp4,
      title: null, // Widipe often doesn't give title in this endpoint, rely on yts title
    };
  }
  throw new Error("Widipe API returned no MP4");
}

async function getBk9Video(url) {
  const res = await axios.get(
    `https://bk9.fun/download/youtube?url=${encodeURIComponent(url)}`,
    AXIOS_DEFAULTS
  );
  if (res.data?.BK9?.video?.url) {
    return {
      download: res.data.BK9.video.url,
      title: res.data.BK9.title,
    };
  }
  throw new Error("Bk9 API returned no video");
}

async function getIzumiVideo(url) {
  const res = await axios.get(
    `https://izumiiiiiiii.dpdns.org/downloader/youtube?url=${encodeURIComponent(
      url
    )}&format=720`,
    AXIOS_DEFAULTS
  );
  if (res.data?.result?.download) {
    return {
      download: res.data.result.download,
      title: res.data.result.title,
    };
  }
  throw new Error("Izumi API returned no download");
}

async function videoCommand(sock, chatId, message) {
  try {
    const text =
      message.message?.conversation ||
      message.message?.extendedTextMessage?.text;
    const searchQuery = text.split(" ").slice(1).join(" ").trim();

    if (!searchQuery) {
      await sock.sendMessage(
        chatId,
        {
          text: "What video do you want to download? Usage: *video <search query or url>*",
        },
        { quoted: message }
      );
      return;
    }

    // Determine if input is a YouTube link
    let videoUrl = "";
    let videoTitle = "";
    let videoThumbnail = "";

    // Check if it's a URL
    if (
      searchQuery.startsWith("http://") ||
      searchQuery.startsWith("https://")
    ) {
      videoUrl = searchQuery;
    } else {
      // Search YouTube for the video
      try {
        const { videos } = await yts(searchQuery);
        if (!videos || videos.length === 0) {
          await sock.sendMessage(
            chatId,
            { text: "❌ No videos found for your search!" },
            { quoted: message }
          );
          return;
        }
        videoUrl = videos[0].url;
        videoTitle = videos[0].title;
        videoThumbnail = videos[0].thumbnail;
      } catch (err) {
        console.error("YTS Error:", err);
        await sock.sendMessage(
          chatId,
          { text: "❌ Error searching YouTube." },
          { quoted: message }
        );
        return;
      }
    }

    // Send thumbnail/status
    try {
      const captionTitle = videoTitle || searchQuery;
      await sock.sendMessage(
        chatId,
        {
          image: { url: videoThumbnail || "https://i.imgur.com/3Uq8b1L.jpeg" }, // Fallback image if no thumb
          caption: `*${captionTitle}*\n\n🔍 Found! Downloading video...`,
        },
        { quoted: message }
      );
    } catch (e) {
      console.log("Thumb send error (non-fatal):", e.message);
    }

    // Provider Loop
    const providers = [getWidipeVideo, getBk9Video, getIzumiVideo];
    let videoData = null;
    let lastError = null;

    for (const provider of providers) {
      try {
        videoData = await provider(videoUrl);
        if (videoData) break;
      } catch (e) {
        console.warn(`Video provider failed: ${e.message}`);
        lastError = e;
      }
    }

    if (!videoData) {
      await sock.sendMessage(
        chatId,
        {
          text: "❌ Failed to download video from all sources. Please try again later.",
        },
        { quoted: message }
      );
      return;
    }

    // Send video directly using the download URL
    await sock.sendMessage(
      chatId,
      {
        video: { url: videoData.download },
        mimetype: "video/mp4",
        fileName: `${videoData.title || videoTitle || "video"}.mp4`,
        caption: `*${
          videoData.title || videoTitle || "Video"
        }*\n\n> *_Downloaded by 𝕊𝔸𝕄𝕂𝕀𝔼𝕃 𝔹𝕆𝕋 _*`,
      },
      { quoted: message }
    );
  } catch (error) {
    console.error("[VIDEO] Command Error:", error?.message || error);
    await sock.sendMessage(
      chatId,
      { text: "❌ Critical error: " + (error?.message || "Unknown error") },
      { quoted: message }
    );
  }
}

module.exports = videoCommand;
