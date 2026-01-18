/**
 * SoundCloud Download Command
 * Downloads audio from SoundCloud
 */

const axios = require("axios");
const { sendText } = require("../lib/sendResponse");

const TIMEOUT = 30000;

async function soundcloudCommand(sock, chatId, message, args) {
  const url = args[0]?.trim();

  if (!url || !url.includes("soundcloud.com")) {
    return await sendText(
      sock,
      chatId,
      "☁️ *SoundCloud Download*\n\n" +
        "*Usage:* .soundcloud <link>\n\n" +
        "*Example:*\n" +
        ".soundcloud https://soundcloud.com/artist/track",
    );
  }

  try {
    await sendText(sock, chatId, "☁️ *Downloading from SoundCloud...*");

    const apis = [
      {
        name: "Siputzx",
        url: `https://api.siputzx.my.id/api/d/soundcloud?url=${encodeURIComponent(url)}`,
        extract: (d) => ({
          url: d?.data?.dl || d?.data?.url,
          title: d?.data?.title,
        }),
      },
      {
        name: "Gifted",
        url: `https://api.giftedtech.my.id/api/download/soundcloud?apikey=gifted&url=${encodeURIComponent(url)}`,
        extract: (d) => ({
          url: d?.result?.url || d?.result?.download_url,
          title: d?.result?.title,
        }),
      },
      {
        name: "RyzenDesu",
        url: `https://api.ryzendesu.vip/api/downloader/soundcloud?url=${encodeURIComponent(url)}`,
        extract: (d) => ({ url: d?.result || d?.url, title: d?.title }),
      },
    ];

    let audio = null;
    for (const api of apis) {
      try {
        const { data } = await axios.get(api.url, { timeout: TIMEOUT });
        audio = api.extract(data);
        if (audio?.url) break;
      } catch (e) {
        console.log(`SoundCloud: ${api.name} failed`);
      }
    }

    if (!audio?.url) {
      return await sendText(
        sock,
        chatId,
        "❌ Could not download from SoundCloud.",
      );
    }

    await sock.sendMessage(
      chatId,
      {
        audio: { url: audio.url },
        mimetype: "audio/mpeg",
        fileName: `${audio.title || "SoundCloud"}.mp3`,
        ptt: false,
      },
      { quoted: message },
    );
  } catch (error) {
    console.error("SoundCloud Error:", error.message);
    await sendText(sock, chatId, "❌ Failed to download from SoundCloud.");
  }
}

module.exports = soundcloudCommand;
