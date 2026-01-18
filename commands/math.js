/**
 * Math Command - Solve math problems using AI
 * WhatsApp-friendly formatting
 */

const axios = require("axios");
const settings = require("../settings");
const { loadPrefix } = require("../lib/prefix");

const TIMEOUT = 30000;

// Clean formatting for WhatsApp
function formatForWhatsApp(text) {
  return (
    text
      // Convert **bold** to *bold* (WhatsApp style)
      .replace(/\*\*([^*]+)\*\*/g, "*$1*")
      // Remove triple asterisks
      .replace(/\*\*\*/g, "*")
      // Convert markdown headers to bold
      .replace(/^###?\s+(.+)$/gm, "*$1*")
      // Convert backtick code to regular text
      .replace(/`([^`]+)`/g, "$1")
      // Remove code blocks markers
      .replace(/```[\s\S]*?```/g, (match) =>
        match.replace(/```\w*\n?/g, "").trim(),
      )
      // Clean up excessive newlines
      .replace(/\n{3,}/g, "\n\n")
      .trim()
  );
}

async function mathCommand(sock, chatId, message) {
  try {
    const text =
      message.message?.conversation ||
      message.message?.extendedTextMessage?.text ||
      "";

    const p = loadPrefix() === "off" ? "" : loadPrefix();
    const parts = text.split(/\s+/);
    const problem = parts.slice(1).join(" ").trim();

    if (!problem) {
      return await sock.sendMessage(
        chatId,
        {
          text: `🧮 *Math Solver*\n\nUsage: ${p}math <problem>\n\nExamples:\n• ${p}math 2+2\n• ${p}math solve x^2 + 5x + 6 = 0\n• ${p}math what is 15% of 200`,
        },
        { quoted: message },
      );
    }

    try {
      await sock.sendMessage(chatId, {
        react: { text: "🧮", key: message.key },
      });
    } catch (e) {}

    const query = `Solve this math problem. Show steps clearly. Use simple formatting without markdown code blocks. Problem: ${problem}`;
    let answer = null;

    // Try Mistral first
    const apiKey = settings.mistralApiKey;
    const agentId = settings.mistralAgentId;

    if (apiKey && agentId) {
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

        answer =
          response.data?.outputs?.[0]?.content ||
          response.data?.message?.content ||
          response.data?.choices?.[0]?.message?.content;
      } catch (e) {}
    }

    // Try Groq as backup
    if (!answer && settings.groqApiKey) {
      try {
        const response = await axios.post(
          "https://api.groq.com/openai/v1/chat/completions",
          {
            model: "llama-3.3-70b-versatile",
            messages: [
              {
                role: "system",
                content:
                  "You are a math tutor. Solve problems step by step. Use simple text formatting, no markdown code blocks. Use * for emphasis.",
              },
              { role: "user", content: query },
            ],
            temperature: 0.3,
            max_tokens: 1024,
          },
          {
            headers: {
              Authorization: `Bearer ${settings.groqApiKey}`,
              "Content-Type": "application/json",
            },
            timeout: TIMEOUT,
          },
        );

        answer = response.data?.choices?.[0]?.message?.content;
      } catch (e) {}
    }

    if (answer) {
      const cleanAnswer = formatForWhatsApp(answer);
      await sock.sendMessage(chatId, {
        react: { text: "✅", key: message.key },
      });
      await sock.sendMessage(
        chatId,
        {
          text: `🧮 *Math Solution*\n\n${cleanAnswer}`,
        },
        { quoted: message },
      );
    } else {
      await sock.sendMessage(chatId, {
        react: { text: "❌", key: message.key },
      });
      await sock.sendMessage(
        chatId,
        {
          text: "❌ Could not solve this problem. Try again.",
        },
        { quoted: message },
      );
    }
  } catch (error) {
    await sock.sendMessage(
      chatId,
      {
        text: `❌ Error: ${error.message}`,
      },
      { quoted: message },
    );
  }
}

module.exports = mathCommand;
