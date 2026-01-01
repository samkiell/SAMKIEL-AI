const axios = require("axios");
const yts = require("yt-search");
const { ytmp4 } = require("ruhend-scraper");
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

// Provider Functions

async function getRuhendVideo(url) {
  const data = await ytmp4(url);
  if (!data) throw new Error("Ruhend Scraper returned no data");

  // Check possible valid structures from ruhend-scraper
  if (data.video) {
    return {
      download: data.video,
      title: data.title,
    };
  } else if (data.url) {
    return {
      download: data.url,
      title: data.title,
    };
  } else if (data.data?.url) {
    // Sometimes it's nested
    return {
      download: data.data.url,
      title: data.data.title || data.title,
    };
  }

  throw new Error("Ruhend Scraper returned no valid video url");
}

async function getWidipeVideo(url) {
  const res = await axios.get(
    `https://widipe.com/download/ytdl?url=${encodeURIComponent(url)}`,
    AXIOS_DEFAULTS
  );
  if (res.data?.result?.mp4) {
    return {
      download: res.data.result.mp4,
      title: null,
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

async function getDarkYasiyaVideo(url) {
  const res = await axios.get(
    `https://api.dark-yasiya-api.vercel.app/download/ytmp4?url=${encodeURIComponent(
      url
    )}`,
    AXIOS_DEFAULTS
  );
  if (res.data?.status && res.data?.result?.url) {
    return {
      download: res.data.result.url,
      title: res.data.result.title,
    };
  }
  throw new Error("Dark Yasiya API returned no video");
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

    const currentPrefix = loadPrefix();
    const p = currentPrefix === "off" ? "" : currentPrefix;

    if (!searchQuery) {
      await sock.sendMessage(
        chatId,
        {
          text: `What video do you want to download? Usage: *${p}video <search query or url>*`,
          ...global.channelInfo,
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
            {
              text: "❌ No videos found for your search!",
              ...global.channelInfo,
            },
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
          { text: "❌ Error searching YouTube.", ...global.channelInfo },
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
          ...global.channelInfo,
        },
        { quoted: message }
      );
    } catch (e) {
      console.log("Thumb send error (non-fatal):", e.message);
    }

    // Provider Loop
    // Priority: Ruhend (Local/Powerful) -> External APIs -> Fallback
    const providers = [
      getRuhendVideo,
      getWidipeVideo,
      getBk9Video,
      getDarkYasiyaVideo,
      getIzumiVideo,
    ];
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
          ...global.channelInfo,
        },
        { quoted: message }
      );
      return;
    }

    // DOWNLOAD TO TEMP FILE LOGIC
    // Ensure temp directory exists
    const tmpDir = path.join(__dirname, "../tmp");
    if (!fs.existsSync(tmpDir)) {
      try {
        fs.mkdirSync(tmpDir);
      } catch (e) {}
    }

    const tempFileName = `video_${Date.now()}.mp4`;
    const tempFilePath = path.join(tmpDir, tempFileName);

    try {
      // Download the video stream to file
      const writer = fs.createWriteStream(tempFilePath);
      const response = await axios({
        url: videoData.download,
        method: "GET",
        responseType: "stream",
        ...AXIOS_DEFAULTS,
      });

      response.data.pipe(writer);

      await new Promise((resolve, reject) => {
        writer.on("finish", resolve);
        writer.on("error", reject);
      });

      // Send the file
      await sock.sendMessage(
        chatId,
        {
          video: { url: tempFilePath }, // Baileys handles local paths
          mimetype: "video/mp4",
          fileName: `SAMKIEL-BOT - ${
            videoData.title || videoTitle || "video"
          }.mp4`,
          caption: `*${
            videoData.title || videoTitle || "Video"
          }*\n\n> *_Downloaded by 𝕊𝔸𝕄𝕂𝕀𝔼𝕃 𝔹𝕆𝕋 _*`,
          ...global.channelInfo,
        },
        { quoted: message }
      );

      // Cleanup
      setTimeout(() => {
        if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
      }, 120000); // 2 minutes delay
    } catch (downloadError) {
      console.error(
        "Temp download failed:",
        downloadError.message || String(downloadError)
      );
      // Fallback to sending URL directly if file download fails
      await sock.sendMessage(
        chatId,
        {
          video: { url: videoData.download },
          mimetype: "video/mp4",
          fileName: `SAMKIEL-BOT - ${
            videoData.title || videoTitle || "video"
          }.mp4`,
          caption: `*${
            videoData.title || videoTitle || "Video"
          }*\n\n> *_Downloaded by 𝕊𝔸𝕄𝕂𝕀𝔼𝕃 𝔹𝕆𝕋 _*`,
          ...global.channelInfo,
        },
        { quoted: message }
      );
    }
  } catch (error) {
    console.error("[VIDEO] Command Error:", error.message || String(error));
    await sock.sendMessage(
      chatId,
      {
        text: "❌ Critical error: " + (error?.message || "Unknown error"),
        ...global.channelInfo,
      },
      { quoted: message }
    );
  }
}

module.exports = videoCommand;
