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
          text: `🎥 *Movie Search*\n\nPlease provide a movie or TV show name.\nExample: *${p}movie Avengers*\n\nTo download to WhatsApp directly:\n*${p}movie dl <Name>*`,
          ...global.channelInfo,
        },
        { quoted: message }
      );
    }

    // Handle Direct Download Sub-command (Search by Name and Download)
    if (args[0] === "dl" && args[1]) {
      const movieTitle = args.slice(1).join(" ");
      await sock.sendMessage(chatId, {
        react: { text: "⏳", key: message.key },
      });

      // 1. Search for movie to get the ID
      const searchUrl = `https://movieapi.giftedtech.co.ke/api/search/${encodeURIComponent(
        movieTitle
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
          { text: `❌ Could not find any movie matching "${movieTitle}".` },
          { quoted: message }
        );
      }

      const movieId = searchRes.data.results.items[0].subjectId;

      // 2. Get movie info for filename
      const infoUrl = `https://movieapi.giftedtech.co.ke/api/info/${movieId}`;
      const infoRes = await axios.get(infoUrl);
      const movie = infoRes.data.results.subject;

      // 3. Get download sources
      const sourcesUrl = `https://movieapi.giftedtech.co.ke/api/sources/${movieId}`;
      const sourcesRes = await axios.get(sourcesUrl);
      const sources = sourcesRes.data.results || [];

      if (sources.length === 0) {
        return await sock.sendMessage(
          chatId,
          { text: "❌ No direct download sources found for this movie." },
          { quoted: message }
        );
      }

      // Pick the best available quality (usually first in list)
      const downloadUrl = sources[0].download_url;
      const quality = sources[0].quality;

      await sock.sendMessage(
        chatId,
        {
          text: `📥 *Downloading:* ${movie.title} (${quality})\n\n_Please wait, this might take a few minutes..._`,
          ...global.channelInfo,
        },
        { quoted: message }
      );

      try {
        await sock.sendMessage(
          chatId,
          {
            document: { url: downloadUrl },
            fileName: `SAMKIEL-BOT - ${movie.title} [${quality}].mp4`,
            mimetype: "video/mp4",
            caption: `🎬 *${movie.title}*\n✅ Download Complete!`,
            ...global.channelInfo,
          },
          { quoted: message }
        );
        await sock.sendMessage(chatId, {
          react: { text: "✅", key: message.key },
        });
      } catch (dlErr) {
        console.error("Movie download error:", dlErr);
        await sock.sendMessage(
          chatId,
          {
            text: "❌ Failed to send movie directly. It may be too large for WhatsApp.",
          },
          { quoted: message }
        );
      }
      return;
    }

    // 1. Search for movie (Standard Search)
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
      `🆔 *ID:* \`${movieId}\`\n` +
      `📅 *Release:* ${movie.releaseDate || "N/A"}\n` +
      `⭐ *Rating:* ${movie.imdbRatingValue || "N/A"}/10\n` +
      `🎭 *Genre:* ${movie.genre || "N/A"}\n` +
      `⏱️ *Duration:* ${Math.floor(movie.duration / 60)} min\n\n` +
      `📝 *Description:* ${
        movie.description.substring(0, 300) || "No description available."
      }...\n` +
      `${downloadLinks}\n\n` +
      `💡 *Tip:* To download directly to WhatsApp, use:\n*${p}movie dl ${movie.title}*\n\n` +
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
