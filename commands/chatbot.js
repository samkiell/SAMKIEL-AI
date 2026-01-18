/**
 * Chatbot Command - Auto-reply for groups
 * Uses Mistral AI Agent (primary) and Groq (backup)
 */

const axios = require("axios");
const settings = require("../settings");
const { loadPrefix } = require("../lib/prefix");
const { getChatbot, setChatbot } = require("../lib/index");

const TIMEOUT = 20000;

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
        text: "✅ Chatbot enabled for this group.\n\nI will reply when someone mentions 'bot' or 'samkiel'.",
      },
      { quoted: message },
    );
  } else if (action === "off") {
    await setChatbot(chatId, false);
    return await sock.sendMessage(
      chatId,
      {
        text: "❌ Chatbot disabled for this group.",
      },
      { quoted: message },
    );
  } else {
    const status = await getChatbot(chatId);
    return await sock.sendMessage(
      chatId,
      {
        text: `Chatbot is ${status?.enabled ? "✅ enabled" : "❌ disabled"}.\n\nUsage: ${p}chatbot on/off`,
      },
      { quoted: message },
    );
  }
}

async function handleChatbotResponse(
  sock,
  chatId,
  message,
  userMessage,
  senderId,
) {
  if (!userMessage || userMessage.length < 3) return;

  const chatbotData = await getChatbot(chatId);
  if (!chatbotData?.enabled) return;

  // Check if message mentions bot
  const botMentions = [
    "bot",
    "samkiel",
    settings.botName?.toLowerCase(),
  ].filter(Boolean);
  const lowerMessage = userMessage.toLowerCase();
  const shouldRespond = botMentions.some((m) => m && lowerMessage.includes(m));

  if (!shouldRespond) return;

  try {
    let answer = null;

    // Try Mistral first (primary)
    if (settings.mistralApiKey && settings.mistralAgentId) {
      try {
        const response = await axios.post(
          "https://api.mistral.ai/v1/conversations",
          {
            agent_id: settings.mistralAgentId,
            inputs: [{ role: "user", content: userMessage }],
          },
          {
            headers: {
              Authorization: `Bearer ${settings.mistralApiKey}`,
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
        console.error("Chatbot Mistral error:", e.message);
      }
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
                  "You are SAMKIEL BOT, a friendly WhatsApp assistant. Keep responses concise and helpful.",
              },
              { role: "user", content: userMessage },
            ],
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
        console.error("Chatbot Groq error:", e.message);
      }
    }

    if (answer && answer.length > 2) {
      const cleanAnswer = answer.replace(/\*\*([^*]+)\*\*/g, "*$1*").trim();
      await sock.sendMessage(
        chatId,
        { text: cleanAnswer },
        { quoted: message },
      );
    }
  } catch (error) {
    console.error("Chatbot error:", error.message);
  }
}

module.exports = { handleChatbotCommand, handleChatbotResponse };
