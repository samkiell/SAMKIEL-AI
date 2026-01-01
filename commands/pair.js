const axios = require("axios");
const { sleep } = require("../lib/myfunc");
const { loadPrefix } = require("../lib/prefix");

async function pairCommand(sock, chatId, message, q) {
  try {
    const currentPrefix = loadPrefix();
    const p = currentPrefix === "off" ? "" : currentPrefix;

    if (!q) {
      return await sock.sendMessage(chatId, {
        text: `Please provide valid WhatsApp number\nExample: ${p}pair 91702395XXXX`,
        ...global.channelInfo,
      });
    }

    const numbers = q
      .split(",")
      .map((v) => v.replace(/[^0-9]/g, ""))
      .filter((v) => v.length > 5 && v.length < 20);

    if (numbers.length === 0) {
      return await sock.sendMessage(chatId, {
        text: "Invalid number❌️ Please use the correct format!",
        ...global.channelInfo,
      });
    }

    for (const number of numbers) {
      const whatsappID = number + "@s.whatsapp.net";
      const result = await sock.onWhatsApp(whatsappID);

      if (!result[0]?.exists) {
        return await sock.sendMessage(chatId, {
          text: `That number is not registered on WhatsApp❗️`,
          ...global.channelInfo,
        });
      }

      await sock.sendMessage(chatId, {
        text: "Wait a moment for the code",
        ...global.channelInfo,
      });

      try {
        const response = await axios.get(
          `https://knight-bot-paircode.onrender.com/pair?number=${number}`
        );

        if (response.data && response.data.code) {
          const code = response.data.code;
          if (code === "Service Unavailable") {
            throw new Error("Service Unavailable");
          }

          await sleep(5000);
          await sock.sendMessage(chatId, {
            text: `Your pairing code: ${code}`,
            ...global.channelInfo,
          });
        } else {
          throw new Error("Invalid response from server");
        }
      } catch (apiError) {
        console.error("API Error:", apiError);
        const errorMessage =
          apiError.message === "Service Unavailable"
            ? "Service is currently unavailable. Please try again later."
            : "Failed to generate pairing code. Please try again later.";

        await sock.sendMessage(chatId, {
          text: errorMessage,
          ...global.channelInfo,
        });
      }
    }
  } catch (error) {
    console.error(error);
    await sock.sendMessage(chatId, {
      text: "An error occurred. Please try again later.",
      ...global.channelInfo,
    });
  }
}

module.exports = pairCommand;
