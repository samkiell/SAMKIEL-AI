const yts = require("yt-search");
const axios = require("axios");

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
        ...global.channelInfo,
      });
    }

    // Search for the song
    const { videos } = await yts(searchQuery);
    console.log(
      "YouTube search result:",
      videos && videos.length ? videos[0] : "No videos"
    );
    if (!videos || videos.length === 0) {
      console.log("No songs found!");
      return await sock.sendMessage(chatId, {
        text: "No songs found!",
        ...global.channelInfo,
      });
    }

    // Get the first video result
    const video = videos[0];
    const urlYt = video.url;
    console.log("First video URL:", urlYt);

    // Send preview message with thumbnail, title, duration, views and custom download message
    try {
      await sock.sendMessage(
        chatId,
        {
          image: { url: video.thumbnail },
          caption: `*${
            video.title
          }*\n\n*Status:* ⬇️ Downloading...\n*Duration:* ${
            video.timestamp
          }\n*Views:* ${video.views.toLocaleString()}\n\n *POWERED BY 𝕊𝔸𝕄𝕂𝕀𝔼𝕃 𝔹𝕆𝕋*`,
          ...global.channelInfo,
        },
        { quoted: message }
      );
    } catch (e) {
      console.log("Failed to send preview image:", e);
    }

    // List of providers to try
    const providers = [
      {
        name: "Keith",
        url: `https://apis-keith.vercel.app/download/dlmp3?url=${urlYt}`,
        parse: (res) =>
          res.data?.result?.data?.downloadUrl || res.data?.result?.downloadUrl,
        getTitle: (res) =>
          res.data?.result?.data?.title || res.data?.result?.title,
      },
      {
        name: "Vreden",
        url: `https://api.vreden.my.id/api/ytmp3?url=${urlYt}`,
        parse: (res) =>
          res.data?.result?.download?.url || res.data?.result?.url,
        getTitle: (res) =>
          res.data?.result?.metadata?.title || res.data?.result?.title,
      },
      {
        name: "Itzpire",
        url: `https://itzpire.com/download/ytmp3?url=${urlYt}`,
        parse: (res) =>
          res.data?.data?.downloadUrl || res.data?.result?.downloadUrl,
        getTitle: (res) => res.data?.data?.title || res.data?.result?.title,
      },
      {
        name: "GiftedTech",
        url: `https://api.giftedtech.web.id/api/download/ytmp3?apikey=gifted&url=${urlYt}`,
        parse: (res) => res.data?.result?.download_url || res.data?.result?.url,
        getTitle: (res) => res.data?.result?.title,
      },
    ];

    let audioUrl = null;
    let audioTitle = video.title;

    for (const provider of providers) {
      try {
        console.log(`Trying provider: ${provider.name}`);
        const res = await axios.get(provider.url, { timeout: 15000 });
        const resultUrl = provider.parse(res);
        if (resultUrl) {
          audioUrl = resultUrl;
          audioTitle = provider.getTitle(res) || audioTitle;
          console.log(`Success with provider: ${provider.name}`);
          break;
        }
      } catch (e) {
        console.warn(`Provider ${provider.name} failed:`, e.message);
        continue;
      }
    }

    if (!audioUrl) {
      console.log("No providers worked");
      return await sock.sendMessage(chatId, {
        text: "❌ Failed to fetch audio from all available sources. Please try again later.",
        ...global.channelInfo,
      });
    }

    // Send the audio
    console.log("Sending audio file:", audioUrl);
    await sock.sendMessage(
      chatId,
      {
        audio: { url: audioUrl },
        mimetype: "audio/mpeg",
        fileName: `SAMKIEL-BOT - ${audioTitle}.mp3`,
        ...global.channelInfo,
      },
      { quoted: message }
    );
  } catch (error) {
    console.error("Error in play command:", error);
    await sock.sendMessage(chatId, {
      text: "❌ Download failed or timed out. Please try again later.",
      ...global.channelInfo,
    });
  }
}

module.exports = playCommand;
