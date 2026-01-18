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
      "☁️ *SoundCloud Download*\n\nUsage: .soundcloud <link>",
    );
  }

  try {
    await sendText(sock, chatId, "☁️ *Downloading from SoundCloud...*");

    let audio = null;
    let success = false;

    // --- ROBUST CHAIN ---
    // 1. Widipe API
    if (!success) {
      try {
        const { data } = await axios.get(
          `https://widipe.com.pl/api/m/dl?url=${encodeURIComponent(url)}`,
          { timeout: TIMEOUT },
        );
        if (data?.result?.dl) {
          audio = { url: data.result.dl, title: data.result.title };
          success = true;
        }
      } catch (e) {
        console.log("SoundCloud: Widipe failed");
      }
    }

    // 2. Cobalt API
    if (!success) {
      try {
        const { data } = await axios.post(
          "https://api.cobalt.tools/api/json",
          { url: url, isAudioOnly: true },
          {
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
            },
            timeout: TIMEOUT,
          },
        );
        if (data?.url) {
          audio = { url: data.url, title: "SoundCloud Audio" };
          success = true;
        }
      } catch (e) {
        console.log("SoundCloud: Cobalt failed");
      }
    }

    // 3. BK4 Mirror
    if (!success) {
      try {
        const { data } = await axios.get(
          `https://bk4-api.vercel.app/download/soundcloud?url=${encodeURIComponent(url)}`,
          { timeout: TIMEOUT },
        );
        if (data?.status && data?.data?.url) {
          audio = { url: data.data.url, title: data.data.title };
          success = true;
        }
      } catch (e) {
        console.log("SoundCloud: BK4 failed");
      }
    }

    // 4. Siputzx (Fallback)
    if (!success) {
      try {
        const { data } = await axios.get(
          `https://api.siputzx.my.id/api/d/soundcloud?url=${encodeURIComponent(url)}`,
          { timeout: TIMEOUT },
        );
        if (data?.data?.dl) {
          audio = { url: data.data.dl, title: data.data.title };
          success = true;
        }
      } catch (e) {
        console.log("SoundCloud: Siputzx failed");
      }
    }

    // 5. Gifted (Fallback)
    if (!success) {
      try {
        const { data } = await axios.get(
          `https://api.giftedtech.my.id/api/download/soundcloud?apikey=gifted&url=${encodeURIComponent(url)}`,
          { timeout: TIMEOUT },
        );
        if (data?.result?.download_url) {
          audio = { url: data.result.download_url, title: data.result.title };
          success = true;
        }
      } catch (e) {
        console.log("SoundCloud: Gifted failed");
      }
    }

    if (!audio?.url) {
      return await sendText(
        sock,
        chatId,
        "❌ Could not download from SoundCloud. APIs busy.",
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
