/**
 * AI Command Handler - GPT, Gemini, DeepSeek
 * Uses Mistral AI Agent (primary) and Groq (backup)
 */

const axios = require("axios");
const settings = require("../settings");
const { loadPrefix } = require("../lib/prefix");
const { sendReaction } = require("../lib/reactions");

const TIMEOUT = 30000;

async function tryMistralAPI(query) {
  const apiKey = settings.mistralApiKey;
  const agentId = settings.mistralAgentId;

  if (!apiKey || !agentId) return null;

  try {
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

    if (answer && answer.length > 5) return answer;
  } catch (e) {}
  return null;
}

async function tryGroqAPI(query) {
  const apiKey = settings.groqApiKey;
  if (!apiKey) return null;

  try {
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
    if (answer && answer.length > 5) return answer;
  } catch (e) {}
  return null;
}

function cleanFormatting(text) {
  return text
    .replace(/\*\*([^*]+)\*\*/g, "*$1*")
    .replace(/\*\*\*/g, "*")
    .trim();
}

async function aiCommand(sock, chatId, message) {
  try {
    const text =
      message.message?.conversation ||
      message.message?.extendedTextMessage?.text ||
      "";

    const currentPrefix = loadPrefix();
    const p = currentPrefix === "off" ? "" : currentPrefix;

    const parts = text.split(/\s+/);
    const query = parts.slice(1).join(" ").trim();

    if (!query) {
      return await sock.sendMessage(
        chatId,
        {
          text: `Please provide a question.\n\nUsage: ${p}gpt <question>`,
        },
        { quoted: message },
      );
    }

    try {
      await sendReaction(sock, message, "💭");
    } catch (e) {}

    let answer = await tryMistralAPI(query);
    if (!answer) {
      answer = await tryGroqAPI(query);
    }

    if (answer) {
      const cleanAnswer = cleanFormatting(answer);
      await sendReaction(sock, message, "✅");
      await sock.sendMessage(
        chatId,
        { text: cleanAnswer },
        { quoted: message },
      );
    } else {
      await sendReaction(sock, message, "❌");
      await sock.sendMessage(
        chatId,
        {
          text: "Sorry, AI is currently unavailable. Try again later.",
        },
        { quoted: message },
      );
    }
  } catch (error) {
    try {
      await sendReaction(sock, message, "❌");
      await sock.sendMessage(
        chatId,
        {
          text: `Error: ${error.message}`,
        },
        { quoted: message },
      );
    } catch (e) {}
  }
}

module.exports = aiCommand;
