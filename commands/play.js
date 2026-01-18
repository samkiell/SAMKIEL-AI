const yts = require("yt-search");
const axios = require("axios");

// Channel Info
const channelInfo = {
  contextInfo: {
    forwardingScore: 1,
    isForwarded: true,
    forwardedNewsletterMessageInfo: {
      newsletterJid: "1203634008622713830@newsletter",
      newsletterName: "𝕊𝔸𝕄𝕂𝕀𝔼𝕃 𝔹𝕆𝕋",
      serverMessageId: -1,
    },
  },
};

const AXIOS_DEFAULTS = {
  timeout: 60000,
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    Accept: "application/json, text/plain, */*",
  },
};

async function tryRequest(getter, attempts = 3) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await getter();
    } catch (err) {
      lastError = err;
      if (attempt < attempts) {
        await new Promise((r) => setTimeout(r, 1000 * attempt));
      }
    }
  }
  throw lastError;
}

async function getIzumiDownloadByUrl(youtubeUrl) {
  const apiUrl = `https://izumiiiiiiii.dpdns.org/downloader/youtube?url=${encodeURIComponent(
    youtubeUrl,
  )}&format=mp3`;
  const res = await tryRequest(() => axios.get(apiUrl, AXIOS_DEFAULTS));
  if (res?.data?.result?.download) return res.data.result;
  throw new Error("Izumi youtube?url returned no download");
}

async function getIzumiDownloadByQuery(query) {
  const apiUrl = `https://izumiiiiiiii.dpdns.org/downloader/youtube-play?query=${encodeURIComponent(
    query,
  )}`;
  const res = await tryRequest(() => axios.get(apiUrl, AXIOS_DEFAULTS));
  if (res?.data?.result?.download) return res.data.result;
  throw new Error("Izumi youtube-play returned no download");
}

async function getOkatsuDownloadByUrl(youtubeUrl) {
  const apiUrl = `https://okatsu-rolezapiiz.vercel.app/downloader/ytmp3?url=${encodeURIComponent(
    youtubeUrl,
  )}`;
  const res = await tryRequest(() => axios.get(apiUrl, AXIOS_DEFAULTS));
  // Okatsu response shape: { status, creator, title, format, thumb, duration, cached, dl }
  if (res?.data?.dl) {
    return {
      download: res.data.dl,
      title: res.data.title,
      thumbnail: res.data.thumb,
    };
  }
  throw new Error("Okatsu ytmp3 returned no download");
}

async function getAsithaAudio(youtubeUrl) {
  const apiKey =
    "0c97d662e61301ae4fa667fbb8001051e00c02f8369c756c10a1404a95fe0edb";
  const apiUrl = `https://foreign-marna-sithaunarathnapromax-9a005c2e.koyeb.app/api/ytapi?url=${encodeURIComponent(
    youtubeUrl,
  )}&fo=2&qu=128&apiKey=${apiKey}`;
  const res = await tryRequest(() => axios.get(apiUrl, AXIOS_DEFAULTS));
  if (res?.data?.downloadData?.url) {
    return {
      url: res.data.downloadData.url,
      title: null,
    };
  }
  throw new Error("Asitha API returned no download");
}

async function playCommand(sock, chatId, message) {
  try {
    console.log("playCommand called");
    const text =
      message.message?.conversation ||
      message.message?.extendedTextMessage?.text;
    console.log("Extracted text:", text);
    const searchQuery = text.split(" ").slice(1).join(" ").trim();
    console.log("Search query:", searchQuery);

    if (!searchQuery) {
      console.log("No search query provided");
      return await sock.sendMessage(chatId, {
        text: "What song do you want to download?",
      });
    }

    // Search for the song
    const { videos } = await yts(searchQuery);
    console.log(
      "YouTube search result:",
      videos && videos.length ? videos[0] : "No videos",
    );
    if (!videos || videos.length === 0) {
      console.log("No songs found!");
      return await sock.sendMessage(chatId, {
        text: "No songs found!",
      });
    }

    // Get the first video result
    const video = videos[0];
    const urlYt = video.url;
    console.log("First video URL:", urlYt);

    // Send preview message with thumbnail and start animation
    let key;
    try {
      const initialMsg = await sock.sendMessage(
        chatId,
        {
          image: { url: video.thumbnail },
          caption: `*${video.title}*\n\n*Duration:* ${
            video.timestamp
          }\n*Views:* ${video.views.toLocaleString()}\n\n⏳ *Downloading Audio...*`,
          contextInfo: channelInfo.contextInfo,
        },
        { quoted: message },
      );
      key = initialMsg.key;

      // Animation logic
      const loaders = [
        "⬜⬜⬜⬜⬜ 0%",
        "🟩⬜⬜⬜⬜ 20%",
        "🟩🟩⬜⬜⬜ 40%",
        "🟩🟩🟩⬜⬜ 60%",
        "🟩🟩🟩🟩⬜ 80%",
        "🟩🟩🟩🟩🟩 100%",
      ];

      (async () => {
        for (const loader of loaders) {
          await new Promise((r) => setTimeout(r, 1000));
          await sock.sendMessage(chatId, {
            edit: key,
            caption: `*${video.title}*\n\n*Duration:* ${
              video.timestamp
            }\n*Views:* ${video.views.toLocaleString()}\n\n⏳ *Downloading Audio...*\n${loader}`,
            text: "", // Required for some baileys versions when editing image captions
          });
        }
      })();
    } catch (e) {
      console.log("Failed to send preview image:", e);
    }

    // Try providers with fallback
    let audioData;
    let success = false;

    // Try providers with fallback
    let audioData;
    let success = false;

    // 1) Primary: Widipe API (New Reliable Source)
    try {
      console.log("Trying Widipe API...");
      const apiUrl = `https://widipe.com.pl/api/m/dl?url=${encodeURIComponent(urlYt)}`;
      const res = await axios.get(apiUrl, AXIOS_DEFAULTS);

      // Response format: { status: true, result: { title, thumbnail, timestamp, views, dl, quality } }
      if (res.data?.status && res.data?.result?.dl) {
        audioData = {
          url: res.data.result.dl,
          title: res.data.result.title,
        };
        success = true;
      } else {
        throw new Error("Widipe returned invalid data");
      }
    } catch (e) {
      console.log("Widipe API failed:", e.message);

      // 2) Secondary: Cobalt API (Backup)
      try {
        console.log("Trying Cobalt API...");
        const cobaltUrl = "https://api.cobalt.tools/api/json";
        const res = await axios.post(
          cobaltUrl,
          {
            url: urlYt,
            isAudioOnly: true,
          },
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
        } else {
          throw new Error("Cobalt returned no URL");
        }
      } catch (err) {
        console.log("Cobalt API failed:", err.message);
      }
    }

    if (!success || !audioData) {
      console.log("All APIs failed");
      return await sock.sendMessage(chatId, {
        text: "Failed to fetch audio from all sources. Please try again later.",
      });
    }

    const audioUrl = audioData.download || audioData.dl || audioData.url;
    const title = audioData.title || video.title || "Audio";
    console.log("Audio URL:", audioUrl, "Title:", title);

    // Send the audio
    console.log("Sending audio file");
    const sentAudio = await sock.sendMessage(
      chatId,
      {
        audio: { url: audioUrl },
        mimetype: "audio/mpeg",
        fileName: `${title}.mp3`,
      },
      { quoted: message },
    );

    // Prompt for MP3 document version - quote the audio message itself
    await sock.sendMessage(
      chatId,
      {
        text: "Reply to this audio with *'mp3'* to download it in document format.",
      },
      { quoted: sentAudio },
    );
  } catch (error) {
    console.error("Error in play command:", error);
    await sock.sendMessage(chatId, {
      text: "Download failed. Please try again later.",
    });
  }
}

module.exports = playCommand;
