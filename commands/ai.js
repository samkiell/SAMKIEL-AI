/**
 * AI Command (v2.0) - GPT, Gemini, DeepSeek
 * 5+ Fallback APIs per model
 * Proper animation handling
 */

const axios = require("axios");
const { appendMessage, getContext } = require("../lib/aiMemory");
const { loadPrefix } = require("../lib/prefix");

const TIMEOUT = 30000;

/**
 * GPT API Endpoints (5+ fallbacks)
 */
const GPT_APIS = [
  {
    name: "Siputzx Llama",
    url: (q) =>
      `https://api.siputzx.my.id/api/ai/llama33?prompt=You+are+AI+developed+by+SAMKIEL&text=${encodeURIComponent(q)}`,
    extract: (d) => d?.data || d?.result,
  },
  {
    name: "Siputzx GPT3",
    url: (q) =>
      `https://api.siputzx.my.id/api/ai/gpt3?content=${encodeURIComponent(q)}`,
    extract: (d) => d?.data || d?.result,
  },
  {
    name: "Popcat Chatbot",
    url: (q) =>
      `https://api.popcat.xyz/chatbot?owner=Samkiel&botname=SamkielAI&msg=${encodeURIComponent(q)}`,
    extract: (d) => d?.response,
  },
  {
    name: "Qewertyy GPT",
    url: (q) =>
      `https://api.qewertyy.dev/models?model_id=16&prompt=${encodeURIComponent(q)}`,
    extract: (d) => d?.content || d?.result,
  },
  {
    name: "RyzenDesu GPT",
    url: (q) =>
      `https://api.ryzendesu.vip/api/ai/chatgpt?text=${encodeURIComponent(q)}`,
    extract: (d) => d?.result || d?.answer,
  },
  {
    name: "Gifted GPT",
    url: (q) =>
      `https://api.giftedtech.my.id/api/ai/gpt?apikey=gifted&q=${encodeURIComponent(q)}`,
    extract: (d) => d?.result,
  },
];

/**
 * Gemini API Endpoints (5+ fallbacks)
 */
const GEMINI_APIS = [
  {
    name: "Google Gemini Official",
    type: "post",
    url: "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=AIzaSyD6B3n7bjM0-fe9vbzxgw47IxltNoTcEAU",
    body: (q) => ({ contents: [{ parts: [{ text: q }] }] }),
    extract: (d) => d?.candidates?.[0]?.content?.parts?.[0]?.text,
  },
  {
    name: "Vreden Gemini",
    url: (q) =>
      `https://api.vreden.my.id/api/ai/gemini?query=${encodeURIComponent(q)}`,
    extract: (d) => d?.result?.response || d?.result,
  },
  {
    name: "Siputzx Gemini",
    url: (q) =>
      `https://api.siputzx.my.id/api/ai/gemini?prompt=${encodeURIComponent(q)}`,
    extract: (d) => d?.data || d?.result,
  },
  {
    name: "Gifted Gemini",
    url: (q) =>
      `https://api.giftedtech.my.id/api/ai/gemini?apikey=gifted&q=${encodeURIComponent(q)}`,
    extract: (d) => d?.result,
  },
  {
    name: "RyzenDesu Gemini",
    url: (q) =>
      `https://api.ryzendesu.vip/api/ai/gemini?text=${encodeURIComponent(q)}`,
    extract: (d) => d?.result || d?.answer,
  },
];

/**
 * DeepSeek API Endpoints (5+ fallbacks)
 */
const DEEPSEEK_APIS = [
  {
    name: "JIKAN MOEAPI",
    url: (q) =>
      `https://jikan.moeapi.net/v1/deepseek?q=${encodeURIComponent(q)}`,
    extract: (d) => d?.result || d?.answer,
  },
  {
    name: "Gifted DeepSeek",
    url: (q) =>
      `https://api.giftedtech.my.id/api/ai/deepseek?apikey=gifted&q=${encodeURIComponent(q)}`,
    extract: (d) => d?.result,
  },
  {
    name: "Siputzx DeepSeek",
    url: (q) =>
      `https://api.siputzx.my.id/api/ai/deepseek?prompt=${encodeURIComponent(q)}`,
    extract: (d) => d?.data || d?.result,
  },
  {
    name: "RyzenDesu DeepSeek",
    url: (q) =>
      `https://api.ryzendesu.vip/api/ai/deepseek?text=${encodeURIComponent(q)}`,
    extract: (d) => d?.result || d?.answer,
  },
  {
    name: "Qewertyy DeepSeek",
    url: (q) =>
      `https://api.qewertyy.dev/models?model_id=26&prompt=${encodeURIComponent(q)}`,
    extract: (d) => d?.content || d?.result,
  },
];

/**
 * Try multiple APIs with fallback
 */
async function tryApis(apis, query) {
  for (const api of apis) {
    try {
      let response;
      if (api.type === "post") {
        response = await axios.post(api.url, api.body(query), {
          headers: { "Content-Type": "application/json" },
          timeout: TIMEOUT,
        });
      } else {
        response = await axios.get(api.url(query), { timeout: TIMEOUT });
      }

      const answer = api.extract(response.data);
      if (answer && typeof answer === "string" && answer.length > 5) {
        console.log(`✅ AI: ${api.name} succeeded`);
        return answer;
      }
    } catch (e) {
      console.log(`❌ AI: ${api.name} failed - ${e.message}`);
    }
  }
  return null;
}

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
        { quoted: message },
      );
    }

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
        { quoted: message },
      );
    }

    // Show loading message
    const initialMsg = await sock.sendMessage(
      chatId,
      {
        text: "🧠 Thinking...",
      },
      { quoted: message },
    );
    const key = initialMsg.key;

    // Animation control
    let loading = true;
    const loaders = [
      "⬜⬜⬜⬜⬜ 0%",
      "🟩⬜⬜⬜⬜ 20%",
      "🟩🟩⬜⬜⬜ 40%",
      "🟩🟩🟩⬜⬜ 60%",
      "🟩🟩🟩🟩⬜ 80%",
      "🟩🟩🟩🟩🟩 100%",
    ];

    // Start animation in background
    const animationPromise = (async () => {
      let i = 0;
      while (loading) {
        await new Promise((r) => setTimeout(r, 500));
        if (!loading) break;
        try {
          await sock.sendMessage(chatId, {
            text: `🧠 Processing...\n${loaders[i % loaders.length]}`,
            edit: key,
          });
        } catch (e) {}
        i++;
      }
    })();

    // Function to stop animation
    const stopAnimation = async (success = true) => {
      loading = false;
      await new Promise((r) => setTimeout(r, 100)); // Let loop exit
      try {
        await sock.sendMessage(chatId, {
          text: success ? "✅ Response ready!" : "❌ Failed",
          edit: key,
        });
      } catch (e) {}
    };

    // Normalize command
    if (p && commandPart.startsWith(p)) {
      commandPart = commandPart.slice(p.length);
    }

    const userId = message.key.participant || message.key.remoteJid;
    appendMessage(userId, "user", query);

    let answer = null;

    // Route to appropriate AI
    if (commandPart === "gpt" || commandPart === "chatgpt") {
      answer = await tryApis(GPT_APIS, query);
    } else if (commandPart === "gemini" || commandPart === "bard") {
      answer = await tryApis(GEMINI_APIS, query);
    } else if (commandPart === "deepseek" || commandPart === "ds") {
      answer = await tryApis(DEEPSEEK_APIS, query);
    } else {
      // Default to GPT
      answer = await tryApis(GPT_APIS, query);
    }

    // Stop animation FIRST
    await stopAnimation(!!answer);

    if (answer) {
      appendMessage(userId, "assistant", answer);
      await sock.sendMessage(
        chatId,
        {
          text: answer,
          ...global.channelInfo,
        },
        { quoted: message },
      );
    } else {
      await sock.sendMessage(
        chatId,
        {
          text: "❌ All AI APIs failed. Please try again later.",
          ...global.channelInfo,
        },
        { quoted: message },
      );
    }
  } catch (error) {
    console.error("AI Command Error:", error.message);
    await sock.sendMessage(
      chatId,
      {
        text: "❌ An error occurred. Please try again.",
        ...global.channelInfo,
      },
      { quoted: message },
    );
  }
}

module.exports = aiCommand;
