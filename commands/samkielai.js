/**
 * SAMKIEL AI Command - Simple, Direct Response
 * Powered by Mistral AI Agent
 */

const axios = require("axios");
const settings = require("../settings");
const { loadPrefix } = require("../lib/prefix");

const TIMEOUT = 30000;

async function samkielaiCommand(sock, chatId, message) {
  console.log(`[SAMKIELAI] ========== COMMAND START ==========`);
  console.log(`[SAMKIELAI] Chat: ${chatId}`);

  try {
    // Extract text from message
    const text =
      message.message?.conversation ||
      message.message?.extendedTextMessage?.text ||
      "";

    console.log(`[SAMKIELAI] Raw text: "${text}"`);

    const currentPrefix = loadPrefix();
    const p = currentPrefix === "off" ? "" : currentPrefix;

    // Get query - everything after the command
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

    console.log(`[SAMKIELAI] Query: "${query}"`);

    if (!query) {
      console.log(`[SAMKIELAI] No query provided`);
      return await sock.sendMessage(
        chatId,
        {
          text: `Please provide a question.\n\nExample: ${p}skai who are you?`,
        },
        { quoted: message },
      );
    }

    // React to show processing
    try {
      await sock.sendMessage(chatId, {
        react: { text: "💭", key: message.key },
      });
    } catch (e) {}

    // Debug: Log all available settings keys
    console.log(
      `[SAMKIELAI] Settings keys: ${Object.keys(settings).join(", ")}`,
    );

    const apiKey = settings.mistralApiKey;
    const agentId = settings.mistralAgentId;

    console.log(
      `[SAMKIELAI] API Key: ${apiKey ? "SET (" + apiKey.substring(0, 5) + "...)" : "MISSING"}`,
    );
    console.log(`[SAMKIELAI] Agent ID: ${agentId || "MISSING"}`);

    if (!apiKey || !agentId) {
      console.log(`[SAMKIELAI] ERROR: Missing credentials`);
      return await sock.sendMessage(
        chatId,
        {
          text: "AI credentials not configured.",
        },
        { quoted: message },
      );
    }

    console.log(`[SAMKIELAI] Calling Mistral API...`);

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

    console.log(`[SAMKIELAI] API Response status: ${response.status}`);

    const answer =
      response.data?.outputs?.[0]?.content ||
      response.data?.message?.content ||
      response.data?.choices?.[0]?.message?.content ||
      response.data?.content ||
      "";

    console.log(`[SAMKIELAI] Answer length: ${answer.length}`);

    if (answer && answer.length > 2) {
      // Clean up formatting - remove double asterisks
      let cleanAnswer = answer
        .replace(/\*\*([^*]+)\*\*/g, "*$1*") // Convert **text** to *text*
        .replace(/\*\*\*/g, "*") // Fix any ***
        .trim();

      await sock.sendMessage(chatId, {
        react: { text: "✅", key: message.key },
      });
      await sock.sendMessage(
        chatId,
        { text: cleanAnswer },
        { quoted: message },
      );
      console.log(`[SAMKIELAI] Response sent successfully`);
    } else {
      console.log(`[SAMKIELAI] Empty response from AI`);
      await sock.sendMessage(
        chatId,
        {
          text: "Sorry, I couldn't generate a response. Please try again.",
        },
        { quoted: message },
      );
    }
  } catch (error) {
    console.log(`[SAMKIELAI] ERROR: ${error.message}`);
    if (error.response) {
      console.log(
        `[SAMKIELAI] API Error: ${JSON.stringify(error.response.data)}`,
      );
    }

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

  console.log(`[SAMKIELAI] ========== COMMAND END ==========`);
}

module.exports = samkielaiCommand;
