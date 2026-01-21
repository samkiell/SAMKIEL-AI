/**
 * AI Command Handler - GPT, Gemini, DeepSeek
 * Uses Mistral AI Agent (primary) and Groq (backup)
 */

const axios = require("axios");
const settings = require("../settings");
const { loadPrefix } = require("../lib/prefix");
const { sendReaction } = require("../lib/reactions");

const TIMEOUT = 30000;

const { downloadMediaMessage } = require("@whiskeysockets/baileys");
const fs = require("fs");
const path = require("path");

async function tryMistralAPI(query, imageBuffer = null) {
  const apiKey = settings.mistralApiKey;
  const agentId = settings.mistralAgentId;

  if (!apiKey || !agentId) return null;

  try {
    const content = [{ type: "text", text: query }];
    if (imageBuffer) {
      content.push({
        type: "image_url",
        image_url: {
          url: `data:image/jpeg;base64,${imageBuffer.toString("base64")}`,
        },
      });
    }

    const response = await axios.post(
      "https://api.mistral.ai/v1/agents/completions",
      {
        agent_id: agentId,
        messages: [{ role: "user", content: content }],
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
    if (answer && answer.length > 2) return answer;
  } catch (e) {
    console.error("Mistral AI Error:", e.response?.data || e.message);
  }
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

async function aiCommand(
  sock,
  chatId,
  message,
  directQuery = null,
  imageMsg = null,
) {
  try {
    let query = directQuery;
    let imageBuffer = null;

    if (!query) {
      const text =
        message.message?.conversation ||
        message.message?.extendedTextMessage?.text ||
        "";
      const parts = text.split(/\s+/);
      query = parts.slice(1).join(" ").trim();
    }

    // Handle image if provided or if message itself is an image
    const targetMsg = imageMsg || message;
    const isImage = !!(
      targetMsg.message?.imageMessage ||
      targetMsg.message?.viewOnceMessageV2?.message?.imageMessage ||
      targetMsg.message?.viewOnceMessage?.message?.imageMessage
    );

    if (isImage) {
      try {
        imageBuffer = await downloadMediaMessage(
          targetMsg,
          "buffer",
          {},
          { logger: console },
        );
      } catch (e) {
        console.error("Image download error:", e);
      }
    }

    if (!query && !isImage) {
      return await sock.sendMessage(
        chatId,
        { text: `Please provide a question or an image to solve.` },
        { quoted: message },
      );
    }

    // Default query if only image is provided
    if (!query && isImage)
      query = "Solve this or explain what is in this image.";

    try {
      await sendReaction(sock, message, "💭");
    } catch (e) {}

    let answer = await tryMistralAPI(query, imageBuffer);
    if (!answer && !imageBuffer) {
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
        { text: "Sorry, I couldn't process this request. AI may be busy." },
        { quoted: message },
      );
    }
  } catch (error) {
    console.error("AI Command Error:", error);
    try {
      await sendReaction(sock, message, "❌");
    } catch (e) {}
  }
}

module.exports = aiCommand;
