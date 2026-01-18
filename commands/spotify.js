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
 * API 1: Spotify to YouTube via Search (Reliable method)
 */
async function downloadViaYouTube(
  trackName,
  artistName,
  sock,
  chatId,
  message,
) {
  const searchQuery = `${trackName} ${artistName} official audio`;
  const { videos } = await yts(searchQuery);

  if (!videos || videos.length === 0) {
    throw new Error("No YouTube results found");
  }

  const video = videos[0];
  const youtubeUrl = video.url;

  // Use our proven audio download chain
  const apis = [
    {
      name: "David Cyril",
      fn: async () => {
        const res = await axios.get(
          `https://apis.davidcyril.name.ng/download/ytaudio?url=${encodeURIComponent(youtubeUrl)}&apikey=harriet`,
          { timeout: TIMEOUT },
        );
        if (res.data?.success && res.data?.result?.download_url)
          return res.data.result.download_url;
        throw new Error("No URL");
      },
    },
    {
      name: "Siputzx",
      fn: async () => {
        const res = await axios.get(
          `https://api.siputzx.my.id/api/d/ytmp3?url=${encodeURIComponent(youtubeUrl)}`,
          { timeout: TIMEOUT },
        );
        if (res.data?.status && res.data?.data?.dl) return res.data.data.dl;
        throw new Error("No URL");
      },
    },
    {
      name: "Gifted",
      fn: async () => {
        const res = await axios.get(
          `https://api.giftedtech.my.id/api/download/ytmp3?apikey=gifted&url=${encodeURIComponent(youtubeUrl)}`,
          { timeout: TIMEOUT },
        );
        if (res.data?.result?.download_url) return res.data.result.download_url;
        throw new Error("No URL");
      },
    },
  ];

  let audioUrl = null;
  for (const api of apis) {
    try {
      audioUrl = await api.fn();
      if (audioUrl) break;
    } catch (e) {
      console.log(`Spotify: ${api.name} failed`);
    }
  }

  if (!audioUrl) throw new Error("All download APIs failed");

  return {
    audioUrl,
    title: video.title,
    thumbnail: video.thumbnail,
    duration: video.timestamp,
  };
}

async function spotifyCommand(sock, chatId, message, args) {
  const query = args.join(" ").trim();

  if (!query) {
    return await sendText(
      sock,
      chatId,
      "🎵 *Spotify Download*\n\n" +
        "*Usage:*\n" +
        "• .spotify <spotify link>\n" +
        "• .spotify <song name>\n\n" +
        "*Example:*\n" +
        "• .spotify https://open.spotify.com/track/...\n" +
        "• .spotify Blinding Lights The Weeknd",
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
      if (!trackId) {
        return await sendText(sock, chatId, "❌ Invalid Spotify link");
      }

      // Try to get track info from Spotify embed
      try {
        const embedUrl = `https://open.spotify.com/embed/track/${trackId}`;
        const res = await axios.get(embedUrl, { timeout: 10000 });

        // Parse title from embed HTML
        const titleMatch = res.data.match(/<title>([^<]+)<\/title>/);
        if (titleMatch) {
          const fullTitle = titleMatch[1].replace(" | Spotify", "");
          const parts = fullTitle.split(" - ");
          trackName = parts[0] || fullTitle;
          artistName = parts[1] || "";
        }
      } catch (e) {
        console.log("Spotify: Could not fetch track info, using ID");
        trackName = trackId;
      }
    }

    // Download via YouTube
    const result = await downloadViaYouTube(
      trackName,
      artistName,
      sock,
      chatId,
      message,
    );

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
