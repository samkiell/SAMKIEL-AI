/**
 * SAMKIEL AI Command - Simple, Direct Response
 * Powered by Mistral AI Agent
 */

const axios = require("axios");
const settings = require("../settings");
const { loadPrefix } = require("../lib/prefix");
const { sendReaction } = require("../lib/reactions");

const TIMEOUT = 30000;

async function samkielaiCommand(sock, chatId, message) {
  try {
    const text =
      message.message?.conversation ||
      message.message?.extendedTextMessage?.text ||
      "";

    const currentPrefix = loadPrefix();
    const p = currentPrefix === "off" ? "" : currentPrefix;

    const parts = text.split(/\s+/);
    let query = parts.slice(1).join(" ").trim();

    // Check for quoted message
    const quoted =
      message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    if (quoted) {
      const quotedText =
        quoted.conversation || quoted.extendedTextMessage?.text || "";
      if (quotedText) {
        query = query ? `${query}\n\nContext: ${quotedText}` : quotedText;
      }
    }

    if (!query) {
      return await sock.sendMessage(
        chatId,
        {
          text: `Please provide a question.\n\nExample: ${p}skai who are you?`,
        },
        { quoted: message },
      );
    }

    try {
      await sendReaction(sock, message, "💭");
    } catch (e) {}

    const apiKey = settings.mistralApiKey;
    const agentId = settings.mistralAgentId;

    if (!apiKey || !agentId) {
      return await sock.sendMessage(
        chatId,
        {
          text: "AI credentials not configured.",
        },
        { quoted: message },
      );
    }

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
      response.data?.content ||
      "";

    if (answer && answer.length > 2) {
      let cleanAnswer = answer
        .replace(/\*\*([^*]+)\*\*/g, "*$1*")
        .replace(/\*\*\*/g, "*")
        .trim();

      await sendReaction(sock, message, "✅");
      await sock.sendMessage(
        chatId,
        { text: cleanAnswer },
        { quoted: message },
      );
    } else {
      await sock.sendMessage(
        chatId,
        {
          text: "Sorry, I couldn't generate a response. Please try again.",
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

module.exports = samkielaiCommand;
