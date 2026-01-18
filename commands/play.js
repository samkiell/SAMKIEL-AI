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
        text: "What song do you want to download?\n\n*Powered by SAMKIEL BOT*",
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
        text: "No songs found!\n\n*Powered by SAMKIEL BOT*",
      });
    }

    // Get the first video result
    const video = videos[0];
    const urlYt = video.url;
    console.log("First video URL:", urlYt);

    // Send preview message with thumbnail and start animation
    await sock.sendMessage(chatId, { react: { text: "⏳", key: message.key } });
    let key;
    try {
      const initialMsg = await sock.sendMessage(
        chatId,
        {
          image: { url: video.thumbnail },
          caption: `*${video.title}*\n\n*Duration:* ${
            video.timestamp
          }\n*Views:* ${video.views.toLocaleString()}\n\n⏳ *Downloading Audio...*\n\n*Powered by SAMKIEL BOT*`,
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
    // Variables already declared above

    // 1) Primary: Widipe API (New Reliable Source)
    // ------------------------------------------
    // ROBUST API CHAIN (Prioritizing Working APIs)
    // ------------------------------------------

    // 1) David Cyril API (Confirmed Working)
    if (!success) {
      try {
        console.log("Trying David Cyril API...");
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
        console.log("Trying Keith API...");
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
        console.log("Trying Gifted API...");
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

    // 4) BK4 API (Placeholder / Similar Tech)
    if (!success) {
      try {
        console.log("Trying BK4 Mirror...");
        // bk4 often uses similar endpoints to widely available scrapers
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

    // 5) Widipe API (Previous Primary, now Fallback)
    if (!success) {
      try {
        console.log("Trying Widipe API...");
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

    // 6) Cobalt API (High Quality Backup)
    if (!success) {
      try {
        console.log("Trying Cobalt API...");
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
      console.log("All APIs failed");
      return await sock.sendMessage(chatId, {
        text: "Failed to fetch audio from all sources. Please try again later.\n\n*Powered by SAMKIEL BOT*",
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
        text: "Reply to this audio with *'mp3'* to download it in document format.\n\n*Powered by SAMKIEL BOT*",
      },
      { quoted: sentAudio },
    );
  } catch (error) {
    console.error("Error in play command:", error);
    await sock.sendMessage(chatId, {
      text: "Download failed. Please try again later.\n\n*Powered by SAMKIEL BOT*",
    });
  }
}

module.exports = playCommand;
