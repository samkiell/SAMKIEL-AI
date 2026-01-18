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
    console.error("❌ CRTICAL: AI System Instruction not loaded!");
    return null;
  }

  const contextText = userContext.messages.slice(-5).join("\n");
  const userData = JSON.stringify(userContext.userInfo, null, 2);

  const finalPrompt = `${SYSTEM_INSTRUCTION}

[ CONTEXT ]
${contextText}

[ USER DATA ]
${userData}

[ CURRENT MSG ]
User: ${userMessage}

Respond naturally.`;

  // Fallback APIs
  const CHATBOT_APIS = [
    {
      name: "Siputzx Llama",
      url: `https://api.siputzx.my.id/api/ai/llama33?prompt=${encodeURIComponent(SYSTEM_INSTRUCTION)}&text=${encodeURIComponent(userMessage)}`,
      extract: (d) => d?.data || d?.result,
    },
    {
      name: "Dreaded",
      url: `https://api.dreaded.site/api/chatgpt?text=${encodeURIComponent(finalPrompt)}`,
      extract: (d) => d?.result?.prompt || d?.result,
    },
    {
      name: "Gifted Chatbot",
      url: `https://api.giftedtech.my.id/api/ai/gpt?apikey=gifted&q=${encodeURIComponent(finalPrompt)}`,
      extract: (d) => d?.result,
    },
    {
      name: "RyzenDesu",
      url: `https://api.ryzendesu.vip/api/ai/chatgpt?text=${encodeURIComponent(finalPrompt)}`,
      extract: (d) => d?.result || d?.answer,
    },
  ];

  for (const api of CHATBOT_APIS) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

      const response = await fetch(api.url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!response.ok) continue;

      const data = await response.json();
      const answer = api.extract(data);

      if (answer && typeof answer === "string" && answer.length > 2) {
        return answer.trim();
      }
    } catch (e) {
      // Fail silent
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
