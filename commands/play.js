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
          }\n*Views:* ${video.views.toLocaleString()}\n\n *𝕊𝔸𝕄𝕂𝕀𝔼𝕃 𝔹𝕆𝕋 is Downloading Audio for you, _Please wait..._*`,
          contextInfo: channelInfo.contextInfo,
        },
        { quoted: message }
      );
    } catch (e) {
      console.log("Failed to send preview image:", e);
    }

    // Fetch audio data from API
    const apiKey =
      "0c97d662e61301ae4fa667fbb8001051e00c02f8369c756c10a1404a95fe0edb";
    const apiUrl = `https://foreign-marna-sithaunarathnapromax-9a005c2e.koyeb.app/api/ytapi?url=${encodeURIComponent(
      urlYt
    )}&fo=2&qu=128&apiKey=${apiKey}`;

    const response = await axios.get(apiUrl);
    console.log("API response:", response.data);
    const data = response.data;

    if (!data || !data.downloadData || !data.downloadData.url) {
      console.log("API did not return valid data");
      return await sock.sendMessage(chatId, {
        text: "Failed to fetch audio from the API. Please try again later.",
      });
    }

    const audioUrl = data.downloadData.url;
    const title = video.title || "Audio";
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
