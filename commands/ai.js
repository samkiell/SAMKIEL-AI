const axios = require("axios");
const fetch = require("node-fetch");
const { appendMessage, getContext } = require("../lib/aiMemory");
const { loadPrefix } = require("../lib/prefix");

async function aiCommand(sock, chatId, message) {
  try {
    const text =
      message.message?.conversation ||
      message.message?.extendedTextMessage?.text;

    const currentPrefix = loadPrefix();
    const p = currentPrefix === "off" ? "" : currentPrefix;

    if (!text) {
      return await sock.sendMessage(
        chatId,
        {
          text: `Please provide a question after ${p}gpt or ${p}gemini\n\nExample: ${p}gpt write a basic html code`,
          ...global.channelInfo,
        },
        { quoted: message }
      );
    }

    // Get the command and query
    const parts = text.split(/\s+/);
    let commandPart = parts[0].toLowerCase();
    const query = parts.slice(1).join(" ").trim();

    if (!query) {
      return await sock.sendMessage(
        chatId,
        {
          text: `Please provide a question after ${p}gpt or ${p}gemini`,
          ...global.channelInfo,
        },
        { quoted: message }
      );
    }

    try {
      // Show processing message
      await sock.sendMessage(chatId, {
        react: { text: "🤖", key: message.key },
      });

      const userId = message.key.participant || message.key.remoteJid;
      appendMessage(userId, "user", query);
      const context = getContext(userId);
      const formattedContext = context
        .map((msg) => `${msg.role}: ${msg.content}`)
        .join("\n");
      const finalPrompt = `${formattedContext}\nAI:`;

      // Normalize commandPart by removing prefix if present
      if (p && commandPart.startsWith(p)) {
        commandPart = commandPart.slice(p.length);
      }

      if (commandPart === "gpt") {
        // Array of GPT API endpoints
        const gptApis = [
          `https://widipe.com/openai?text=${encodeURIComponent(query)}`,
          `https://bk9.fun/ai/gpt4?q=${encodeURIComponent(query)}`,
          `https://api.dark-yasiya-api.vercel.app/chat/gpt?query=${encodeURIComponent(
            query
          )}`,
          `https://api.popcat.xyz/chatbot?owner=Samkiel&botname=SamkielAI&msg=${encodeURIComponent(
            query
          )}`,
          `https://api.giftedtech.web.id/api/ai/ai?apikey=gifted&q=${encodeURIComponent(
            query
          )}`,
          `https://api.giftedtech.web.id/api/ai/blackbox?apikey=gifted&q=${encodeURIComponent(
            query
          )}`,
          `https://api.giftedtech.web.id/api/ai/gpt4o?apikey=gifted&q=${encodeURIComponent(
            query
          )}`,
        ];

        for (const api of gptApis) {
          try {
            const response = await axios.get(api);
            const data = response.data;

            if (
              data &&
              (data.message ||
                data.result ||
                data.answer ||
                data.prompt ||
                data.response ||
                data.reply ||
                data.BK9)
            ) {
              const answer =
                data.message ||
                data.result ||
                data.answer ||
                data.prompt ||
                data.response ||
                data.reply ||
                data.BK9;

              appendMessage(userId, "assistant", answer);
              await sock.sendMessage(
                chatId,
                {
                  text: answer,
                  ...global.channelInfo,
                },
                { quoted: message }
              );
              return;
            }
          } catch (e) {
            console.warn(`GPT API failed: ${api}`, e.message);
            continue; // Try the next API if this one fails
          }
        }

        await sock.sendMessage(
          chatId,
          {
            text: "❌ All GPT APIs failed, Elon musk hasnt paid up. Please try again later.",
            ...global.channelInfo,
          },
          { quoted: message }
        );
        return;
      } else if (commandPart === "gemini") {
        const geminiApis = [
          `https://widipe.com/gemini?text=${encodeURIComponent(query)}`,
          `https://api.nyxs.pw/ai/gemini-pro?text=${encodeURIComponent(query)}`,
          `https://bk9.fun/ai/gemini?q=${encodeURIComponent(query)}`,
          `https://api.giftedtech.my.id/api/ai/geminiai?apikey=gifted&q=${encodeURIComponent(
            query
          )}`,
          `https://bk9.fun/ai/deepseek-r1?q=${encodeURIComponent(query)}`,
        ];

        for (const api of geminiApis) {
          try {
            const response = await fetch(api);
            const data = await response.json();

            if (
              data.message ||
              data.data ||
              data.answer ||
              data.result ||
              data.BK9 ||
              data.response
            ) {
              const answer =
                data.message ||
                data.data ||
                data.answer ||
                data.result ||
                data.BK9 ||
                data.response;

              appendMessage(userId, "assistant", answer);
              await sock.sendMessage(
                chatId,
                {
                  text: answer,
                  ...global.channelInfo,
                },
                { quoted: message }
              );
              return;
            }
          } catch (e) {
            console.warn(`Gemini API failed: ${api}`, e.message);
            continue; // Try the next API if this one fails
          }
        }

        await sock.sendMessage(
          chatId,
          {
            text: "❌ All Gemini APIs failed. Please try again later.",
            ...global.channelInfo,
          },
          { quoted: message }
        );
        return;
      }
    } catch (error) {
      console.error("API Error:", error);
      await sock.sendMessage(
        chatId,
        {
          text: "❌ Failed to get response. Please try again later.",
          ...global.channelInfo,
        },
        { quoted: message }
      );
    }
  } catch (error) {
    console.error("AI Command Error:", error);
    await sock.sendMessage(
      chatId,
      {
        text: "❌ An error occurred. Please try again later.",
        ...global.channelInfo,
      },
      { quoted: message }
    );
  }
}

module.exports = aiCommand;
