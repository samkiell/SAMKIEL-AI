/**
 * Chatbot Command - Auto-reply for groups
 * Uses Mistral AI Agent (primary) and Groq (backup)
 */

const axios = require("axios");
const settings = require("../settings");
const { loadPrefix } = require("../lib/prefix");
const { getChatbot, setChatbot } = require("../lib/index");

const TIMEOUT = 20000;

/**
 * Handle chatbot toggle command
 */
async function handleChatbotCommand(
  sock,
  chatId,
  message,
  isOwner,
  isSenderAdmin,
) {
  const p = loadPrefix() === "off" ? "" : loadPrefix();
  const text =
    message.message?.conversation ||
    message.message?.extendedTextMessage?.text ||
    "";
  const parts = text.split(/\s+/);
  const action = parts[1]?.toLowerCase();

  if (!isOwner && !isSenderAdmin) {
    return await sock.sendMessage(
      chatId,
      {
        text: "Only admins can use this command.",
      },
      { quoted: message },
    );
  }

  if (action === "on") {
    await setChatbot(chatId, true);
    return await sock.sendMessage(
      chatId,
      {
        text: "Chatbot enabled for this group.",
      },
      { quoted: message },
    );
  } else if (action === "off") {
    await setChatbot(chatId, false);
    return await sock.sendMessage(
      chatId,
      {
        text: "Chatbot disabled for this group.",
      },
      { quoted: message },
    );
  } else {
    const status = await getChatbot(chatId);
    return await sock.sendMessage(
      chatId,
      {
        text: `Chatbot is ${status?.enabled ? "enabled" : "disabled"}.\n\nUsage: ${p}chatbot on/off`,
      },
      { quoted: message },
    );
  }
}

/**
 * Handle automatic chatbot response for groups
 */
async function handleChatbotResponse(
  sock,
  chatId,
  message,
  userMessage,
  senderId,
) {
  if (!userMessage || userMessage.length < 2) return;

  const chatbotData = await getChatbot(chatId);
  if (!chatbotData?.enabled) return;

  // Check if bot is mentioned or message starts with bot name
  const botMentions = ["bot", "samkiel", settings.botName?.toLowerCase()];
  const lowerMessage = userMessage.toLowerCase();
  const shouldRespond = botMentions.some((m) => lowerMessage.includes(m));

  if (!shouldRespond) return;

  console.log(`[CHATBOT] Responding to: "${userMessage}"`);

  try {
    let answer = null;

    // Try Mistral
    const apiKey = settings.mistralApiKey;
    const agentId = settings.mistralAgentId;

    if (apiKey && agentId) {
      try {
        const response = await axios.post(
          "https://api.mistral.ai/v1/conversations",
          {
            agent_id: agentId,
            inputs: [{ role: "user", content: userMessage }],
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
        console.log(`[CHATBOT] Mistral error: ${e.message}`);
      }
    }

    // Try Groq as backup
    if (!answer && settings.groqApiKey) {
      try {
        const response = await axios.post(
          "https://api.groq.com/openai/v1/chat/completions",
          {
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "user", content: userMessage }],
            temperature: 0.7,
            max_tokens: 500,
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
        console.log(`[CHATBOT] Groq error: ${e.message}`);
      }
    }

    if (answer && answer.length > 2) {
      // Clean formatting
      const cleanAnswer = answer.replace(/\*\*([^*]+)\*\*/g, "*$1*").trim();

      await sock.sendMessage(
        chatId,
        { text: cleanAnswer },
        { quoted: message },
      );
    }
  } catch (error) {
    console.log(`[CHATBOT] Error: ${error.message}`);
  }
}

module.exports = { handleChatbotCommand, handleChatbotResponse };
