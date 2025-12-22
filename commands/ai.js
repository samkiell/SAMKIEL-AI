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
      return await global.reply(sock, message, {
        text: `Please provide a question after ${p}gpt or ${p}gemini\n\nExample: ${p}gpt write a basic html code`,
      });
    }

    // Get the command and query
    const parts = text.split(/\s+/);
    let commandPart = parts[0].toLowerCase();
    const query = parts.slice(1).join(" ").trim();

    if (!query) {
      return await global.reply(sock, message, {
        text: `Please provide a question after ${p}gpt or ${p}gemini`,
      });
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
          `https://api.giftedtech.web.id/api/ai/ai?apikey=gifted&q=${encodeURIComponent(
            query
          )}`,
          `https://api.giftedtech.web.id/api/ai/blackbox?apikey=gifted&q=${encodeURIComponent(
            query
          )}`,
          `https://api.giftedtech.web.id/api/ai/gpt4o?apikey=gifted&q=${encodeURIComponent(
            query
          )}`,
          `https://api.giftedtech.web.id/api/ai/openai?apikey=gifted&q=${encodeURIComponent(
            query
          )}`,
          `https://api.giftedtech.web.id/api/ai/gpt4?apikey=gifted&q=${encodeURIComponent(
            query
          )}`,
        ];

        for (const api of gptApis) {
          try {
            const response = await axios.get(api);

            if (
              response.data &&
              (response.data.message ||
                response.data.result ||
                response.data.answer ||
                response.data.prompt)
            ) {
              const answer =
                response.data.message ||
                response.data.result ||
                response.data.answer ||
                response.data.prompt;
              appendMessage(userId, "assistant", answer);
              await global.reply(sock, message, {
                text: answer,
              });
              return;
            }
          } catch (e) {
            console.warn(`GPT API failed: ${api}`, e);
            continue; // Try the next API if this one fails
          }
        }

        await global.reply(sock, message, {
          text: "❌ All GPT APIs failed, Elon musk hasnt paid up. Please try again later.",
        });
        return;
      } else if (commandPart === "gemini") {
        const geminiApis = [
          `https://api.giftedtech.my.id/api/ai/geminiai?apikey=gifted&q=${encodeURIComponent(
            query
          )}`,

          `https://bk9.fun/ai/deepseek-r1?q=${encodeURIComponent(query)}`,
        ];

        for (const api of geminiApis) {
          try {
            const response = await fetch(api);
            const data = await response.json();

            if (data.message || data.data || data.answer || data.result) {
              const answer =
                data.message || data.data || data.answer || data.result;
              appendMessage(userId, "assistant", answer);
              await global.reply(sock, message, {
                text: answer,
              });
              return;
            }
          } catch (e) {
            console.warn(`Gemini API failed: ${api}`, e);
            continue; // Try the next API if this one fails
          }
        }

        await global.reply(sock, message, {
          text: "❌ All Gemini APIs failed. Please try again later.",
        });
        return;
      }
    } catch (error) {
      console.error("API Error:", error);
      await global.reply(sock, message, {
        text: "❌ Failed to get response. Please try again later.",
      });
    }
  } catch (error) {
    console.error("AI Command Error:", error);
    await global.reply(sock, message, {
      text: "❌ An error occurred. Please try again later.",
    });
  }
}

module.exports = aiCommand;
