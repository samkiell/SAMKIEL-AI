/**
 * AI Command Handler - GPT, Gemini, DeepSeek
 * Uses Mistral AI Agent (primary) and Groq (backup)
 */

const axios = require("axios");
const settings = require("../settings");
const { loadPrefix } = require("../lib/prefix");

const TIMEOUT = 30000;

/**
 * Mistral AI Agent - Primary
 */
async function tryMistralAPI(query) {
  const apiKey = settings.mistralApiKey;
  const agentId = settings.mistralAgentId;

  if (!apiKey || !agentId) {
    console.log("[AI] Mistral: No API key or Agent ID");
    return null;
  }

  try {
    console.log("[AI] Trying Mistral API...");
    const response = await axios.post(
      "https://api.mistral.ai/v1/conversations",
      {
        agent_id: agentId,
        inputs: [{ role: "user", content: query }],
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        timeout: TIMEOUT,
      },
    );

    const answer =
      response.data?.outputs?.[0]?.content ||
      response.data?.message?.content ||
      response.data?.choices?.[0]?.message?.content ||
      response.data?.content;

    if (answer && answer.length > 5) {
      console.log("[AI] Mistral succeeded");
      return answer;
    }
  } catch (e) {
    console.log(`[AI] Mistral failed: ${e.message}`);
  }
  return null;
}

/**
 * Groq API - Backup
 */
async function tryGroqAPI(query) {
  const apiKey = settings.groqApiKey;
  if (!apiKey) {
    console.log("[AI] Groq: No API key");
    return null;
  }

  try {
    console.log("[AI] Trying Groq API...");
    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: query }],
        temperature: 0.7,
        max_tokens: 2048,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        timeout: TIMEOUT,
      },
    );

    const answer = response.data?.choices?.[0]?.message?.content;
    if (answer && answer.length > 5) {
      console.log("[AI] Groq succeeded");
      return answer;
    }
  } catch (e) {
    console.log(`[AI] Groq failed: ${e.message}`);
  }
  return null;
}

/**
 * Clean formatting - reduce bold usage
 */
function cleanFormatting(text) {
  return text
    .replace(/\*\*([^*]+)\*\*/g, "*$1*") // **text** -> *text*
    .replace(/\*\*\*/g, "*")
    .trim();
}

/**
 * Main AI Command
 */
async function aiCommand(sock, chatId, message) {
  console.log(`[AI] ========== COMMAND START ==========`);
  console.log(`[AI] Chat: ${chatId}`);

  try {
    const text =
      message.message?.conversation ||
      message.message?.extendedTextMessage?.text ||
      "";

    console.log(`[AI] Text: "${text}"`);

    const currentPrefix = loadPrefix();
    const p = currentPrefix === "off" ? "" : currentPrefix;

    const parts = text.split(/\s+/);
    const query = parts.slice(1).join(" ").trim();

    console.log(`[AI] Query: "${query}"`);

    if (!query) {
      console.log(`[AI] No query`);
      return await sock.sendMessage(
        chatId,
        {
          text: `Please provide a question.\n\nUsage: ${p}gpt <question>`,
        },
        { quoted: message },
      );
    }

    // React
    try {
      await sock.sendMessage(chatId, {
        react: { text: "💭", key: message.key },
      });
    } catch (e) {}

    // Try Mistral first, then Groq
    let answer = await tryMistralAPI(query);
    if (!answer) {
      answer = await tryGroqAPI(query);
    }

    if (answer) {
      const cleanAnswer = cleanFormatting(answer);
      await sock.sendMessage(chatId, {
        react: { text: "✅", key: message.key },
      });
      await sock.sendMessage(
        chatId,
        { text: cleanAnswer },
        { quoted: message },
      );
      console.log(`[AI] Response sent`);
    } else {
      console.log(`[AI] All APIs failed`);
      await sock.sendMessage(chatId, {
        react: { text: "❌", key: message.key },
      });
      await sock.sendMessage(
        chatId,
        {
          text: "Sorry, AI is currently unavailable. Try again later.",
        },
        { quoted: message },
      );
    }
  } catch (error) {
    console.log(`[AI] Error: ${error.message}`);
    try {
      await sock.sendMessage(chatId, {
        react: { text: "❌", key: message.key },
      });
      await sock.sendMessage(
        chatId,
        {
          text: `Error: ${error.message}`,
        },
        { quoted: message },
      );
    } catch (e) {}
  }

  console.log(`[AI] ========== COMMAND END ==========`);
}

module.exports = aiCommand;
