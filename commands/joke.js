const axios = require("axios");

const validCategories = {
  programming: "Programming",
  misc: "Misc",
  dark: "Dark",
  pun: "Pun",
  spooky: "Spooky",
  christmas: "Christmas",
};

module.exports = async function (sock, chatId, message) {
  try {
    const text = message.body || message.text || "";
    const command = text.split(" ")[0].slice(1).toLowerCase(); // Get command after .
    let category = "Any";

    if (command.startsWith("joke")) {
      const suffix = command.slice(4); // Remove 'joke'
      if (suffix) {
        if (validCategories[suffix]) {
          category = validCategories[suffix];
        } else {
          await sock.sendMessage(
            chatId,
            {
              text: "Invalid joke category. Available: programming, misc, dark, pun, spooky, christmas",
              ...global.channelInfo,
            },
            { quoted: message }
          );
          return;
        }
      }
    }

    const response = await axios.get(
      `https://v2.jokeapi.dev/joke/${category}?type=single`,
      {
        headers: { Accept: "application/json" },
      }
    );
    const joke = response.data.joke;
    await sock.sendMessage(
      chatId,
      { text: `${joke}\n\n> *Powered by SAMKIEL BOT*`, ...global.channelInfo },
      { quoted: message }
    );
  } catch (error) {
    console.error("Error fetching joke:", error);
    await sock.sendMessage(
      chatId,
      {
        text: "Sorry, I could not fetch a joke right now.",
        ...global.channelInfo,
      },
      { quoted: message }
    );
  }
};
