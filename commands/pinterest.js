/**
 * Pinterest Download Command
 * Downloads images/videos from Pinterest links
 */

const axios = require("axios");
const { sendText } = require("../lib/sendResponse");

const TIMEOUT = 20000;

async function pinterestCommand(sock, chatId, message, args) {
  const url = args[0]?.trim();

  const { loadPrefix } = require("../lib/prefix");
  const currentPrefix = loadPrefix();
  const p = currentPrefix === "off" ? "" : currentPrefix;

  if (!url || !/(?:pinterest\.com|pin\.it)/.test(url)) {
    return await sendText(
      sock,
      chatId,
      `📌 *Pinterest Download*\n\nUsage: ${p}pinterest <link>`,
    );
  }

  try {
    await sendText(sock, chatId, "📌 *Downloading from Pinterest...*");

    let media = null;
    let success = false;

    // --- ROBUST CHAIN ---
    // 1. Widipe API
    if (!success) {
      try {
        const { data } = await axios.get(
          `https://widipe.com.pl/api/m/pinterest?url=${encodeURIComponent(url)}`,
          { timeout: TIMEOUT },
        );
        if (data?.result?.url || data?.result?.image || data?.result?.video) {
          const u = data.result.video || data.result.image || data.result.url;
          media = {
            url: u,
            type: u.endsWith(".mp4") ? "video" : "image",
            title: "Pinterest",
          };
          success = true;
        }
      } catch (e) {
        console.log("Pinterest: Widipe failed");
      }
    }

    // 2. BK4 Mirror
    if (!success) {
      try {
        const { data } = await axios.get(
          `https://bk4-api.vercel.app/download/pinterest?url=${encodeURIComponent(url)}`,
          { timeout: TIMEOUT },
        );
        if (data?.status && data?.data?.url) {
          media = {
            url: data.data.url,
            type: data.data.type === "video" ? "video" : "image",
            title: "Pinterest",
          };
          success = true;
        }
      } catch (e) {
        console.log("Pinterest: BK4 failed");
      }
    }

    // 3. Cobalt API
    if (!success) {
      try {
        const { data } = await axios.post(
          "https://api.cobalt.tools/api/json",
          { url: url },
          {
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
            },
            timeout: TIMEOUT,
          },
        );
        if (data?.url) {
          media = { url: data.url, type: "image", title: "Pinterest" }; // Assume image unless known otherwise, or check extension
          if (data.url.includes(".mp4")) media.type = "video";
          success = true;
        }
      } catch (e) {
        console.log("Pinterest: Cobalt failed");
      }
    }

    // 4. Siputzx (Fallback)
    if (!success) {
      try {
        const { data } = await axios.get(
          `https://api.siputzx.my.id/api/d/pinterest?url=${encodeURIComponent(url)}`,
          { timeout: TIMEOUT },
        );
        if (data?.data?.image || data?.data?.video) {
          media = {
            url: data.data.video || data.data.image,
            type: data.data.video ? "video" : "image",
            title: data.data.title,
          };
          success = true;
        }
      } catch (e) {
        console.log("Pinterest: Siputzx failed");
      }
    }

    // 5. Gifted (Fallback)
    if (!success) {
      try {
        const { data } = await axios.get(
          `https://api.giftedtech.my.id/api/download/pinterest?apikey=gifted&url=${encodeURIComponent(url)}`,
          { timeout: TIMEOUT },
        );
        if (data?.result?.url) {
          media = { url: data.result.url, type: "image", title: "Pinterest" };
          success = true;
        }
      } catch (e) {
        console.log("Pinterest: Gifted failed");
      }
    }

    if (!media?.url) {
      return await sendText(
        sock,
        chatId,
        "❌ Could not download from Pinterest.",
      );
    }

    if (media.type === "video") {
      await sock.sendMessage(
        chatId,
        { video: { url: media.url }, caption: `📌 ${media.title}` },
        { quoted: message },
      );
    } else {
      await sock.sendMessage(
        chatId,
        { image: { url: media.url }, caption: `📌 ${media.title}` },
        { quoted: message },
      );
    }
  } catch (error) {
    console.error("Pinterest Error:", error.message);
    await sendText(sock, chatId, "❌ Failed to download from Pinterest.");
  }
}

module.exports = pinterestCommand;
