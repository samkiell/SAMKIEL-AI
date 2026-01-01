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
          text: `Please provide a question after ${p}gpt, ${p}gemini or ${p}deepseek\n\nExample: ${p}gpt write a basic html code`,
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
          text: `Please provide a question after ${p}gpt, ${p}gemini or ${p}deepseek`,
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
          `https://api.siputzx.my.id/api/ai/llama33?prompt=You+are+AI+developed+by+SAMKIEL&text=${encodeURIComponent(
            query
          )}`,
          `https://api.siputzx.my.id/api/ai/gpt3?content=${encodeURIComponent(
            query
          )}`,
          `https://api.popcat.xyz/chatbot?owner=Samkiel&botname=SamkielAI&msg=${encodeURIComponent(
            query
          )}`,
        ];

        for (const api of gptApis) {
          try {
            const response = await axios.get(api);
            const data = response.data;

            if (
              data &&
              (data.data ||
                data.message ||
                data.result ||
                data.answer ||
                data.prompt ||
                data.response ||
                data.reply ||
                data.BK9)
            ) {
              const answer =
                data.data ||
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
        try {
          const geminiApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=AIzaSyD6B3n7bjM0-fe9vbzxgw47IxltNoTcEAU`;

          const response = await axios.post(
            geminiApiUrl,
            {
              contents: [
                {
                  parts: [
                    {
                      text: query,
                    },
                  ],
                },
              ],
            },
            {
              headers: {
                "Content-Type": "application/json",
              },
            }
          );

          if (response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
            const answer = response.data.candidates[0].content.parts[0].text;
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
          console.warn(
            "Primary Gemini API failed, trying fallbacks...",
            e.message
          );
        }

        const geminiApis = [
          `https://api.siputzx.my.id/api/ai/llama33?prompt=You+are+Gemini+developed+by+Google&text=${encodeURIComponent(
            query
          )}`,
          `https://api.giftedtech.web.id/api/ai/geminiai?apikey=gifted&q=${encodeURIComponent(
            query
          )}`,
        ];

        for (const api of geminiApis) {
          try {
            const response = await fetch(api);
            const data = await response.json();

            if (
              data.data ||
              data.message ||
              data.answer ||
              data.result ||
              data.BK9 ||
              data.response
            ) {
              const answer =
                data.data ||
                data.message ||
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
            console.warn(`Gemini Fallback API failed: ${api}`, e.message);
            continue;
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
      } else if (commandPart === "deepseek" || commandPart === "ds") {
        const deepseekApis = [
          `https://api.siputzx.my.id/api/ai/llama33?prompt=You+are+DeepSeek+R1+thinking+AI&text=${encodeURIComponent(
            query
          )}`,
          `https://api.shizo.top/api/ai/deepseek?apikey=𝕊𝔸𝕄𝕂𝕀𝔼𝕃 𝔹𝕆𝕋&q=${encodeURIComponent(
            query
          )}`,
        ];

        for (const api of deepseekApis) {
          try {
            const response = await fetch(api);
            const data = await response.json();

            const answer =
              data.data ||
              data.message ||
              data.result ||
              data.answer ||
              data.BK9 ||
              data.response;

            if (answer) {
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
            console.warn(`DeepSeek API failed: ${api}`, e.message);
            continue;
          }
        }

        await sock.sendMessage(
          chatId,
          {
            text: "❌ All DeepSeek APIs failed. Please try again later.",
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
