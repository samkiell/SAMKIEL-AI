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
      videos && videos.length ? videos[0] : "No videos"
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

    // Send preview message with thumbnail, title, duration, views and custom download message
    try {
      await sock.sendMessage(
        chatId,
        {
          image: { url: video.thumbnail },
          caption: `*${video.title}*\n\n*Duration:* ${
            video.timestamp
          }\n*Views:* ${video.views.toLocaleString()}\n\n *DOWNLOAD BY 𝕊𝔸𝕄𝕂𝕀𝔼𝕃 𝔹𝕆𝕋*`,
          contextInfo: channelInfo.contextInfo,
        },
        { quoted: message }
      );
    } catch (e) {
      console.log("Failed to send preview image:", e);
    }

    // Fetch audio data from API
    const response = await axios.get(
      `https://apis-keith.vercel.app/download/dlmp3?url=${urlYt}`
    );
    console.log("API response:", response.data);
    const data = response.data;

    if (
      !data ||
      !data.status ||
      !data.result ||
      !data.result.data ||
      !data.result.data.downloadUrl
    ) {
      console.log("API did not return valid data");
      return await sock.sendMessage(chatId, {
        text: "Failed to fetch audio from the API. Please try again later.",
      });
    }

    const audioUrl = data.result.data.downloadUrl;
    const title = data.result.data.title;
    console.log("Audio URL:", audioUrl, "Title:", title);

    // Send the audio
    console.log("Sending audio file");
    await sock.sendMessage(
      chatId,
      {
        audio: { url: audioUrl },
        mimetype: "audio/mpeg",
        fileName: `${title}.mp3`,
      },
      { quoted: message }
    );
  } catch (error) {
    console.error("Error in song2 command:", error);
    await sock.sendMessage(chatId, {
      text: "Download failed. Please try again later.",
    });
  }
}

module.exports = playCommand;
