const fetch = require("node-fetch");

async function lyricsCommand(sock, chatId, songTitle, message) {
  if (!songTitle) {
    await sock.sendMessage(
      chatId,
      {
        text: "🔍 Please enter the song name to get the lyrics! Usage: *lyrics <song name>*",
      },
      { quoted: message }
    );
    return;
  }

  try {
    // Primary API: Lyrist (often works for popular songs)
    let apiUrl = `https://lyrist.vercel.app/api/${encodeURIComponent(
      songTitle
    )}`;
    let res = await fetch(apiUrl);
    let data = await res.json();
    let lyrics = data.lyrics;

    // Fallback API: Popcat (if Lyrist fails or returns no lyrics)
    if (!lyrics) {
      apiUrl = `https://api.popcat.xyz/lyrics?song=${encodeURIComponent(
        songTitle
      )}`;
      res = await fetch(apiUrl);
      data = await res.json();
      lyrics = data.lyrics;
    }

    if (!lyrics) {
      await sock.sendMessage(
        chatId,
        {
          text: `❌ Sorry, I couldn't find any lyrics for "${songTitle}".\nTry searching for "Artist - Song Name" or use the *gpt* command.`,
        },
        { quoted: message }
      );
      return;
    }

    const maxChars = 4096;
    const output =
      lyrics.length > maxChars ? lyrics.slice(0, maxChars - 3) + "..." : lyrics;

    await sock.sendMessage(
      chatId,
      {
        text: `🎤 *Lyrics for ${songTitle}*\n\n${output}`,
      },
      { quoted: message }
    );
  } catch (error) {
    console.error("Error in lyrics command:", error);
    await sock.sendMessage(
      chatId,
      {
        text: `❌ Failed to fetch lyrics. \nTip: You can ask the AI for lyrics using:\n*gpt lyrics for ${songTitle}*`,
      },
      { quoted: message }
    );
  }
}

module.exports = { lyricsCommand };
