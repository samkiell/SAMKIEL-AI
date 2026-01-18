/**
 * Spotify Download Command
 * Downloads songs from Spotify links
 */

const axios = require("axios");
const yts = require("yt-search");
const { sendText } = require("../lib/sendResponse");

const TIMEOUT = 30000;

/**
 * Extract Spotify track ID from URL
 */
function extractSpotifyId(url) {
  const patterns = [
    /spotify\.com\/track\/([a-zA-Z0-9]+)/,
    /spotify\.com\/intl-[a-z]+\/track\/([a-zA-Z0-9]+)/,
    /open\.spotify\.com\/track\/([a-zA-Z0-9]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

/**
 * API: Spotify to YouTube via Search (Reliable method)
 */
async function downloadViaYouTube(trackName, artistName) {
  const searchQuery = `${trackName} ${artistName} official audio`;
  const { videos } = await yts(searchQuery);

  if (!videos || videos.length === 0) {
    throw new Error("No YouTube results found");
  }

  const video = videos[0];
  const youtubeUrl = video.url;

  // --- ROBUST AUDIO DOWNLOAD CHAIN ---
  // Same as play.js

  let audioUrl = null;
  let success = false;

  // 1. Keith API
  if (!success) {
    try {
      const res = await axios.get(
        `https://keith-api.vercel.app/api/ytmp3?url=${encodeURIComponent(youtubeUrl)}`,
        { timeout: TIMEOUT },
      );
      if (res.data?.success && res.data?.downloadUrl) {
        audioUrl = res.data.downloadUrl;
        success = true;
      }
    } catch (e) {
      console.log("Spotify: Keith failed");
    }
  }

  // 2. Widipe API
  if (!success) {
    try {
      const res = await axios.get(
        `https://widipe.com.pl/api/m/dl?url=${encodeURIComponent(youtubeUrl)}`,
        { timeout: TIMEOUT },
      );
      if (res.data?.status && res.data?.result?.dl) {
        audioUrl = res.data.result.dl;
        success = true;
      }
    } catch (e) {
      console.log("Spotify: Widipe failed");
    }
  }

  // 3. BK4 Mirror
  if (!success) {
    try {
      const res = await axios.get(
        `https://bk4-api.vercel.app/download/yt?url=${encodeURIComponent(youtubeUrl)}`,
        { timeout: TIMEOUT },
      );
      if (res.data?.status && res.data?.data?.mp3) {
        audioUrl = res.data.data.mp3;
        success = true;
      }
    } catch (e) {
      console.log("Spotify: BK4 failed");
    }
  }

  // 4. Cobalt API
  if (!success) {
    try {
      const res = await axios.post(
        "https://api.cobalt.tools/api/json",
        { url: youtubeUrl, isAudioOnly: true },
        {
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          timeout: TIMEOUT,
        },
      );
      if (res.data?.url) {
        audioUrl = res.data.url;
        success = true;
      }
    } catch (e) {
      console.log("Spotify: Cobalt failed");
    }
  }

  // 5. David Cyril (Fallback)
  if (!success) {
    try {
      const res = await axios.get(
        `https://apis.davidcyril.name.ng/download/ytmp3?url=${encodeURIComponent(youtubeUrl)}`,
        { timeout: TIMEOUT },
      );
      if (res.data?.success && res.data?.result?.download_url) {
        audioUrl = res.data.result.download_url;
        success = true;
      }
    } catch (e) {
      console.log("Spotify: David Cyril failed");
    }
  }

  // 6. Gifted (Fallback)
  if (!success) {
    try {
      const res = await axios.get(
        `https://api.giftedtech.my.id/api/download/ytmp3?apikey=gifted&url=${encodeURIComponent(youtubeUrl)}`,
        { timeout: TIMEOUT },
      );
      if (res.data?.result?.download_url) {
        audioUrl = res.data.result.download_url;
        success = true;
      }
    } catch (e) {
      console.log("Spotify: Gifted failed");
    }
  }

  if (!success || !audioUrl) throw new Error("All download APIs failed");

  return {
    audioUrl,
    title: video.title,
    thumbnail: video.thumbnail,
    duration: video.timestamp,
  };
}

async function spotifyCommand(sock, chatId, message, args) {
  const query = args.join(" ").trim();
  const { loadPrefix } = require("../lib/prefix");
  const currentPrefix = loadPrefix();
  const p = currentPrefix === "off" ? "" : currentPrefix;

  if (!query) {
    return await sendText(
      sock,
      chatId,
      `🎵 *Spotify Download*\n\nUsage: ${p}spotify <link or song name>`,
    );
  }

  // Check if it's a Spotify link
  const isSpotifyLink = query.includes("spotify.com");

  try {
    await sendText(sock, chatId, "🎵 *Processing...*");

    let trackName = query;
    let artistName = "";

    // If it's a Spotify link, try to get track info
    if (isSpotifyLink) {
      const trackId = extractSpotifyId(query);
      if (!trackId)
        return await sendText(sock, chatId, "❌ Invalid Spotify link");

      try {
        const embedUrl = `https://open.spotify.com/embed/track/${trackId}`;
        const res = await axios.get(embedUrl, { timeout: 10000 });
        const titleMatch = res.data.match(/<title>([^<]+)<\/title>/);
        if (titleMatch) {
          const fullTitle = titleMatch[1].replace(" | Spotify", "");
          const parts = fullTitle.split(" - ");
          trackName = parts[0] || fullTitle;
          artistName = parts[1] || "";
        }
      } catch (e) {
        console.log("Spotify: Meta fetch failed, using ID");
        trackName = trackId;
      }
    }

    // Download via YouTube
    const result = await downloadViaYouTube(trackName, artistName);

    // Send audio
    await sock.sendMessage(
      chatId,
      {
        audio: { url: result.audioUrl },
        mimetype: "audio/mpeg",
        fileName: `${result.title}.mp3`,
        ptt: false,
      },
      { quoted: message },
    );
  } catch (error) {
    console.error("Spotify Error:", error.message);
    await sendText(
      sock,
      chatId,
      "❌ Failed to download. Try using .play instead.",
    );
  }
}

module.exports = spotifyCommand;
