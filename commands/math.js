/**
 * Math Command - Solve math problems using AI
 */

const axios = require("axios");
const settings = require("../settings");
const { loadPrefix } = require("../lib/prefix");

const TIMEOUT = 30000;

async function mathCommand(sock, chatId, message) {
  console.log(`[MATH] ========== COMMAND START ==========`);

  try {
    const text =
      message.message?.conversation ||
      message.message?.extendedTextMessage?.text ||
      "";

    const p = loadPrefix() === "off" ? "" : loadPrefix();
    const parts = text.split(/\s+/);
    const problem = parts.slice(1).join(" ").trim();

    console.log(`[MATH] Problem: "${problem}"`);

    if (!problem) {
      return await sock.sendMessage(
        chatId,
        {
          text: `Please provide a math problem.\n\nUsage: ${p}math 2+2`,
        },
        { quoted: message },
      );
    }

    try {
      await sock.sendMessage(chatId, {
        react: { text: "🧮", key: message.key },
      });
    } catch (e) {}

    const query = `Solve this math problem step by step. Be concise. Problem: ${problem}`;

    // Try Mistral
    const apiKey = settings.mistralApiKey;
    const agentId = settings.mistralAgentId;
    let answer = null;

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
      } catch (e) {
        console.log(`[MATH] Mistral error: ${e.message}`);
      }
    }

    // Try Groq as backup
    if (!answer && settings.groqApiKey) {
      try {
        const response = await axios.post(
          "https://api.groq.com/openai/v1/chat/completions",
          {
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "user", content: query }],
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
      } catch (e) {
        console.log(`[MATH] Groq error: ${e.message}`);
      }
    }

    if (answer) {
      // Clean formatting
      const cleanAnswer = answer.replace(/\*\*([^*]+)\*\*/g, "*$1*").trim();

      await sock.sendMessage(chatId, {
        react: { text: "✅", key: message.key },
      });
      await sock.sendMessage(
        chatId,
        { text: cleanAnswer },
        { quoted: message },
      );
    } else {
      await sock.sendMessage(chatId, {
        react: { text: "❌", key: message.key },
      });
      await sock.sendMessage(
        chatId,
        {
          text: "Could not solve this problem. Try again.",
        },
        { quoted: message },
      );
    }
  } catch (error) {
    console.log(`[MATH] Error: ${error.message}`);
    await sock.sendMessage(
      chatId,
      {
        text: `Error: ${error.message}`,
      },
      { quoted: message },
    );
  }

  console.log(`[MATH] ========== COMMAND END ==========`);
}

module.exports = mathCommand;
