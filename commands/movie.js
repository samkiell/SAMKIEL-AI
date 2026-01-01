const axios = require("axios");
const { loadPrefix } = require("../lib/prefix");

async function movieCommand(sock, chatId, message, args) {
  try {
    const currentPrefix = loadPrefix();
    const p = currentPrefix === "off" ? "" : currentPrefix;
    const query = args.join(" ");

    if (!query) {
      return await sock.sendMessage(
        chatId,
        {
          text: `🎥 *Movie Search*\n\nPlease provide a movie or TV show name.\nExample: *${p}movie Avengers*`,
          ...global.channelInfo,
        },
        { quoted: message }
      );
    }

    // 1. Search for movie
    const searchUrl = `https://movieapi.giftedtech.co.ke/api/search/${encodeURIComponent(
      query
    )}`;
    const searchRes = await axios.get(searchUrl);

    if (
      !searchRes.data ||
      !searchRes.data.results ||
      !searchRes.data.results.items ||
      searchRes.data.results.items.length === 0
    ) {
      return await sock.sendMessage(
        chatId,
        {
          text: `❌ No results found for "${query}".`,
          ...global.channelInfo,
        },
        { quoted: message }
      );
    }

    const firstResult = searchRes.data.results.items[0];
    const movieId = firstResult.subjectId;

    // 2. Get movie info
    const infoUrl = `https://movieapi.giftedtech.co.ke/api/info/${movieId}`;
    const infoRes = await axios.get(infoUrl);
    const movie = infoRes.data.results.subject;

    // 3. Get download sources
    const sourcesUrl = `https://movieapi.giftedtech.co.ke/api/sources/${movieId}`;
    const sourcesRes = await axios.get(sourcesUrl);
    const sources = sourcesRes.data.results || [];

    // 4. Format download links
    let downloadLinks = "";
    if (sources.length > 0) {
      downloadLinks = "\n\n📥 *Download Links:*\n";
      sources.forEach((source) => {
        downloadLinks += `• *${source.quality}:* ${source.download_url}\n`;
      });
    }

    // 5. Construct message
    const caption =
      `🎬 *${movie.title}*\n\n` +
      `📅 *Release:* ${movie.releaseDate || "N/A"}\n` +
      `⭐ *Rating:* ${movie.imdbRatingValue || "N/A"}/10\n` +
      `🎭 *Genre:* ${movie.genre || "N/A"}\n` +
      `⏱️ *Duration:* ${Math.floor(movie.duration / 60)} min\n\n` +
      `📝 *Description:* ${
        movie.description || "No description available."
      }\n` +
      `${downloadLinks}\n\n` +
      `*POWERED BY 𝕊𝔸𝕄𝕂𝕀𝔼𝕃 𝔹𝕆𝕋*`;

    // 6. Send message
    await sock.sendMessage(
      chatId,
      {
        image: {
          url:
            movie.thumbnail || firstResult.thumbnail || firstResult.cover.url,
        },
        caption: caption,
        ...global.channelInfo,
      },
      { quoted: message }
    );
  } catch (error) {
    console.error("Error in movie command:", error);
    await sock.sendMessage(
      chatId,
      {
        text: "❌ An error occurred while fetching movie details.",
        ...global.channelInfo,
      },
      { quoted: message }
    );
  }
}

module.exports = movieCommand;
