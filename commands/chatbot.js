const fs = require("fs");
const path = require("path");
const fetch = require("node-fetch");
const { loadPrefix } = require("../lib/prefix");
// Import SYSTEM_INSTRUCTION from ai.js
const { SYSTEM_INSTRUCTION } = require("./ai");

const USER_GROUP_DATA = path.join(__dirname, "../data/userGroupData.json");

// ============================================
// SESSION & DUPLICATE CONTROL
// ============================================

// Cache to prevent duplicate message responses (TTL 10s)
const processedMessages = new Set();
const MESSAGE_TTL = 10000;

function isMessageProcessed(messageId) {
  if (processedMessages.has(messageId)) return true;
  processedMessages.add(messageId);
  setTimeout(() => processedMessages.delete(messageId), MESSAGE_TTL);
  return false;
}

// In-memory storage for chat history
const chatMemory = {
  messages: new Map(), // Stores last 5 messages per user
  userInfo: new Map(), // Stores user information
  lastInteraction: new Map(), // For session inactivity
};

const SESSION_TIMEOUT = 10 * 60 * 1000; // 10 minutes

// ============================================
// DATA MANAGEMENT
// ============================================

function loadUserGroupData() {
  try {
    return JSON.parse(fs.readFileSync(USER_GROUP_DATA));
  } catch (error) {
    return { groups: [], chatbot: {} };
  }
}

function saveUserGroupData(data) {
  try {
    fs.writeFileSync(USER_GROUP_DATA, JSON.stringify(data, null, 2));
  } catch (error) {}
}

// ============================================
// UTILS
// ============================================

function getRandomDelay() {
  return Math.floor(Math.random() * 2000) + 1500; // 1.5 - 3.5s
}

async function showTyping(sock, chatId) {
  try {
    await sock.sendPresenceUpdate("composing", chatId);
    await new Promise((resolve) => setTimeout(resolve, getRandomDelay()));
  } catch (e) {}
}

function extractUserInfo(message) {
  const lower = message.toLowerCase();
  const info = {};
  if (lower.includes("my name is")) {
    info.name = message
      .split(/my name is/i)[1]
      .trim()
      .split(" ")[0];
  }
  return info;
}

// ============================================
// COMMAND HANDLER (ON/OFF)
// ============================================

async function handleChatbotCommand(sock, chatId, message, match) {
  // Guard: Owner/Admin check is done in main or wrapper, but we check here too
  const data = loadUserGroupData();
  const currentPrefix = loadPrefix();
  const p = currentPrefix === "off" ? "" : currentPrefix;

  if (!match) {
    return sock.sendMessage(chatId, {
      text: `*🤖 Chatbot Control*\n\n*${p}chatbot on* - Enable\n*${p}chatbot off* - Disable`,
      quoted: message,
    });
  }

  const mode = match.toLowerCase();

  if (mode === "on") {
    if (data.chatbot[chatId])
      return sock.sendMessage(chatId, {
        text: "✅ Chatbot is *already ON*.",
        quoted: message,
      });
    data.chatbot[chatId] = true;
    saveUserGroupData(data);
    return sock.sendMessage(chatId, {
      text: "✅ Chatbot *Enabled*.",
      quoted: message,
    });
  }

  if (mode === "off") {
    if (!data.chatbot[chatId])
      return sock.sendMessage(chatId, {
        text: "❌ Chatbot is *already OFF*.",
        quoted: message,
      });
    delete data.chatbot[chatId];
    saveUserGroupData(data);
    return sock.sendMessage(chatId, {
      text: "❌ Chatbot *Disabled*.",
      quoted: message,
    });
  }

  if (mode === "reset") {
    chatMemory.messages.clear();
    return sock.sendMessage(chatId, {
      text: "🔄 Chatbot memory cleared.",
      quoted: message,
    });
  }
}

// ============================================
// AI API HANDLER
// ============================================

async function getAIResponse(userMessage, userContext) {
  if (!SYSTEM_INSTRUCTION) {
    console.warn("⚠️ AI System Instruction not loaded, using default.");
  }
  const instruction =
    SYSTEM_INSTRUCTION || "You are SAMKIEL BOT, a helpful AI assistant.";

  const contextText = userContext.messages.slice(-5).join("\n");
  const userData = JSON.stringify(userContext.userInfo, null, 2);

  const finalPrompt = `${instruction}

[ CONTEXT ]
${contextText}

[ USER DATA ]
${userData}

[ CURRENT MSG ]
User: ${userMessage}

Respond naturally.`;

  // Prioritized API List
  const CHATBOT_APIS = [
    {
      name: "Vreden AI",
      url: "https://api.vreden.my.id/ai/chat",
      method: "GET",
      // Vreden usually takes a 'q' or 'prompt' param but let's assume a standard structure or we use the 'ai' command logic
      // Actually vreden has /api/ai/deepseek which I used in ai.js. Let's use that structure.
      constructUrl: (text) =>
        `https://api.vreden.my.id/ai/deepseek?prompt=${encodeURIComponent(instruction)}&text=${encodeURIComponent(text)}`,
      extract: (d) => d?.data?.result || d?.data,
    },
    {
      name: "Siputzx",
      url: "dummy",
      method: "GET",
      constructUrl: (text) =>
        `https://api.siputzx.my.id/api/ai/llama33?prompt=${encodeURIComponent(instruction)}&text=${encodeURIComponent(text)}`,
      extract: (d) => d?.data,
    },
    {
      name: "Ryzendesu",
      url: "dummy",
      method: "GET",
      constructUrl: (text) =>
        `https://api.ryzendesu.vip/api/ai/chatgpt?text=${encodeURIComponent(finalPrompt)}`,
      extract: (d) => d?.result || d?.answer,
    },
    {
      name: "Darkness",
      url: "dummy",
      method: "GET",
      constructUrl: (text) =>
        `https://api.darkness.my.id/api/chatgpt?text=${encodeURIComponent(finalPrompt)}`,
      extract: (d) => d?.result,
    },
  ];

  // Try Mistral AI Agent first (Primary)
  const settings = require("../settings");
  if (settings.mistralApiKey && settings.mistralAgentId) {
    try {
      const axios = require("axios");
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
          timeout: 15000,
        },
      );

      // Try multiple response paths
      const answer =
        response.data?.outputs?.[0]?.content ||
        response.data?.message?.content ||
        response.data?.choices?.[0]?.message?.content ||
        response.data?.content;

      if (answer && answer.length > 2) {
        console.log("✅ Chatbot: Mistral AI Agent succeeded");
        return answer.trim();
      }
    } catch (e) {
      console.log(`❌ Chatbot: Mistral Agent failed - ${e.message}`);
    }
  }

  // Try Groq API as backup
  if (settings.groqApiKey) {
    try {
      const axios = require("axios");
      const response = await axios.post(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: instruction },
            { role: "user", content: userMessage },
          ],
          temperature: 0.8,
          max_tokens: 1024,
        },
        {
          headers: {
            Authorization: `Bearer ${settings.groqApiKey}`,
            "Content-Type": "application/json",
          },
          timeout: 15000,
        },
      );

      const answer = response.data?.choices?.[0]?.message?.content;
      if (answer && answer.length > 2) {
        console.log("✅ Chatbot: Groq API succeeded");
        return answer.trim();
      }
    } catch (e) {
      console.log(`❌ Chatbot: Groq failed - ${e.message}`);
    }
  }

  // Fallback to free APIs
  for (const api of CHATBOT_APIS) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s timeout

      const url = api.constructUrl(userMessage);
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!response.ok) {
        // console.log(`API ${api.name} failed with status: ${response.status}`);
        continue;
      }

      const data = await response.json();
      const answer = api.extract(data);

      if (answer && typeof answer === "string" && answer.length > 2) {
        return answer.trim();
      }
    } catch (e) {
      // console.log(`API ${api.name} error: ${e.message}`);
      continue;
    }
  }
  return null;
}

// ============================================
// MAIN RESPONSE HANDLER
// ============================================

async function handleChatbotResponse(
  sock,
  chatId,
  message,
  userMessage,
  senderId,
) {
  // 1. SAFETY CHECKS
  if (!message.key || !message.key.id) return;
  if (message.key.fromMe) return; // Ignore self
  if (message.key.remoteJid === "status@broadcast") return;

  // 2. DUPLICATE CHECK
  if (isMessageProcessed(message.key.id)) {
    // console.log("Duplicate chatbot trigger ignored:", message.key.id);
    return;
  }

  // 3. CHECK IF ENABLED
  const data = loadUserGroupData();
  if (!data.chatbot[chatId]) return;

  // 4. CHECK FOR MENTIONS (Bot mention OR Reply to bot)
  const botId = sock.user.id.split(":")[0];
  const mentionedJids =
    message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
  const repliedTo =
    message.message?.extendedTextMessage?.contextInfo?.participant;

  const isMentioned = mentionedJids.some((j) => j.includes(botId));
  const isReplyToBot = repliedTo && repliedTo.includes(botId);

  // In groups, strictly only respond to mentions/replies
  if (chatId.endsWith("@g.us")) {
    if (!isMentioned && !isReplyToBot) return;
  }
  // In DM, respond to everything (unless it's a command, which is filtered in main.js)

  try {
    // 5. CLEAN MESSAGE
    let cleaned = userMessage.replace(new RegExp(`@${botId}`, "g"), "").trim();
    if (!cleaned) return;

    // 6. SESSION & MEMORY
    if (!chatMemory.messages.has(senderId)) {
      chatMemory.messages.set(senderId, []);
      chatMemory.userInfo.set(senderId, {});
    }

    // Check session timeout
    const lastTime = chatMemory.lastInteraction.get(senderId) || 0;
    if (Date.now() - lastTime > SESSION_TIMEOUT) {
      chatMemory.messages.set(senderId, []); // Reset expired session
    }
    chatMemory.lastInteraction.set(senderId, Date.now());

    // Update User Info
    const extractedInfo = extractUserInfo(cleaned);
    if (Object.keys(extractedInfo).length > 0) {
      chatMemory.userInfo.set(senderId, {
        ...chatMemory.userInfo.get(senderId),
        ...extractedInfo,
      });
    }

    // Update History
    const history = chatMemory.messages.get(senderId);
    history.push(cleaned);
    if (history.length > 5) history.shift();

    // 7. GET RESPONSE
    await showTyping(sock, chatId);

    const response = await getAIResponse(cleaned, {
      messages: history,
      userInfo: chatMemory.userInfo.get(senderId),
    });

    if (response) {
      await sock.sendMessage(chatId, { text: response }, { quoted: message });

      // Add bot response to history too for better context
      // history.push(response);
    }
  } catch (error) {
    console.error("Chatbot Fatal Error:", error.message);
  }
}

module.exports = {
  handleChatbotCommand,
  handleChatbotResponse,
};
