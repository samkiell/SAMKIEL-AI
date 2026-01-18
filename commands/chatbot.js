const fs = require("fs");
const path = require("path");
const fetch = require("node-fetch");
const { loadPrefix } = require("../lib/prefix");

const USER_GROUP_DATA = path.join(__dirname, "../data/userGroupData.json");

// In-memory storage for chat history and user info
const chatMemory = {
  messages: new Map(), // Stores last 5 messages per user
  userInfo: new Map(), // Stores user information
};

// Load user group data
function loadUserGroupData() {
  try {
    return JSON.parse(fs.readFileSync(USER_GROUP_DATA));
  } catch (error) {
    console.error("❌ Error loading user group data:", error.message);
    return { groups: [], chatbot: {} };
  }
}

// Save user group data
function saveUserGroupData(data) {
  try {
    fs.writeFileSync(USER_GROUP_DATA, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("❌ Error saving user group data:", error.message);
  }
}

// Add random delay between 2-5 seconds
function getRandomDelay() {
  return Math.floor(Math.random() * 3000) + 2000;
}

// Add typing indicator
async function showTyping(sock, chatId) {
  try {
    await sock.presenceSubscribe(chatId);
    await sock.sendPresenceUpdate("composing", chatId);
    await new Promise((resolve) => setTimeout(resolve, getRandomDelay()));
  } catch (error) {
    console.error("Typing indicator error:", error);
  }
}

// Extract user information from messages
function extractUserInfo(message) {
  const info = {};

  // Extract name
  if (message.toLowerCase().includes("my name is")) {
    info.name = message.split("my name is")[1].trim().split(" ")[0];
  }

  // Extract age
  if (
    message.toLowerCase().includes("i am") &&
    message.toLowerCase().includes("years old")
  ) {
    info.age = message.match(/\d+/)?.[0];
  }

  // Extract location
  if (
    message.toLowerCase().includes("i live in") ||
    message.toLowerCase().includes("i am from")
  ) {
    info.location = message
      .split(/(?:i live in|i am from)/i)[1]
      .trim()
      .split(/[.,!?]/)[0];
  }

  return info;
}

async function handleChatbotCommand(sock, chatId, message, match) {
  if (!match) {
    await showTyping(sock, chatId);
    const currentPrefix = loadPrefix();
    const p = currentPrefix === "off" ? "" : currentPrefix;
    return sock.sendMessage(chatId, {
      text: `*CHATBOT SETUP*\n\n*${p}chatbot on*\nEnable chatbot\n\n*${p}chatbot off*\nDisable chatbot in this group`,
      quoted: message,
      ...global.channelInfo,
    });
  }

  const data = loadUserGroupData();

  // Get bot's number
  const botNumber = sock.user.id.split(":")[0] + "@s.whatsapp.net";

  // Check if sender is bot owner
  const senderId =
    message.key.participant ||
    message.participant ||
    message.pushName ||
    message.key.remoteJid;
  const isOwner = senderId === botNumber;

  // If it's the bot owner, allow access immediately
  if (isOwner) {
    if (match === "on") {
      await showTyping(sock, chatId);
      if (data.chatbot[chatId]) {
        return sock.sendMessage(chatId, {
          text: "*Chatbot is already enabled for this group*",
          quoted: message,
          ...global.channelInfo,
        });
      }
      data.chatbot[chatId] = true;
      saveUserGroupData(data);
      console.log(`✅ Chatbot enabled for group ${chatId}`);
      return sock.sendMessage(chatId, {
        text: "*Chatbot has been enabled for this group*",
        quoted: message,
        ...global.channelInfo,
      });
    }

    if (match === "off") {
      await showTyping(sock, chatId);
      if (!data.chatbot[chatId]) {
        return sock.sendMessage(chatId, {
          text: "*Chatbot is already disabled for this group*",
          quoted: message,
          ...global.channelInfo,
        });
      }
      delete data.chatbot[chatId];
      saveUserGroupData(data);
      console.log(`✅ Chatbot disabled for group ${chatId}`);
      return sock.sendMessage(chatId, {
        text: "*Chatbot has been disabled for this group*",
        quoted: message,
        ...global.channelInfo,
      });
    }
  }

  // For non-owners, check admin status
  let isAdmin = false;
  if (chatId.endsWith("@g.us")) {
    try {
      const groupMetadata = await sock.groupMetadata(chatId);
      isAdmin = groupMetadata.participants.some(
        (p) =>
          p.id === senderId &&
          (p.admin === "admin" || p.admin === "superadmin"),
      );
    } catch (e) {
      console.warn(
        "⚠️ Could not fetch group metadata. Bot might not be admin.",
      );
    }
  }

  if (!isAdmin && !isOwner) {
    await showTyping(sock, chatId);
    return sock.sendMessage(chatId, {
      text: "❌ Only group admins or the bot owner can use this command.",
      quoted: message,
      ...global.channelInfo,
    });
  }

  if (match === "on") {
    await showTyping(sock, chatId);
    if (data.chatbot[chatId]) {
      return sock.sendMessage(chatId, {
        text: "*Chatbot is already enabled for this group*",
        quoted: message,
        ...global.channelInfo,
      });
    }
    data.chatbot[chatId] = true;
    saveUserGroupData(data);
    console.log(`✅ Chatbot enabled for group ${chatId}`);
    return sock.sendMessage(chatId, {
      text: "*Chatbot has been enabled for this group*",
      quoted: message,
      ...global.channelInfo,
    });
  }

  if (match === "off") {
    await showTyping(sock, chatId);
    if (!data.chatbot[chatId]) {
      return sock.sendMessage(chatId, {
        text: "*Chatbot is already disabled for this group*",
        quoted: message,
        ...global.channelInfo,
      });
    }
    delete data.chatbot[chatId];
    saveUserGroupData(data);
    console.log(`✅ Chatbot disabled for group ${chatId}`);
    return sock.sendMessage(chatId, {
      text: "*Chatbot has been disabled for this group*",
      quoted: message,
      ...global.channelInfo,
    });
  }

  await showTyping(sock, chatId);
  const currentPrefix = loadPrefix();
  const p = currentPrefix === "off" ? "" : currentPrefix;
  return sock.sendMessage(chatId, {
    text: `*Invalid command. Use ${p}chatbot to see usage*`,
    quoted: message,
    ...global.channelInfo,
  });
}

async function handleChatbotResponse(
  sock,
  chatId,
  message,
  userMessage,
  senderId,
) {
  const data = loadUserGroupData();
  if (!data.chatbot[chatId]) return;

  try {
    // Get bot's ID
    const botNumber = sock.user.id.split(":")[0] + "@s.whatsapp.net";

    // Check for mentions and replies
    let isBotMentioned = false;
    let isReplyToBot = false;

    // Check if message is a reply and contains bot mention
    if (message.message?.extendedTextMessage) {
      const mentionedJid =
        message.message.extendedTextMessage.contextInfo?.mentionedJid || [];
      const quotedParticipant =
        message.message.extendedTextMessage.contextInfo?.participant;

      // Check if bot is mentioned in the reply
      isBotMentioned = mentionedJid.some((jid) => jid === botNumber);

      // Check if replying to bot's message
      isReplyToBot = quotedParticipant === botNumber;
    }
    // Also check regular mentions in conversation
    else if (message.message?.conversation) {
      isBotMentioned = userMessage.includes(`@${botNumber.split("@")[0]}`);
    }

    if (!isBotMentioned && !isReplyToBot) return;

    // Clean the message
    let cleanedMessage = userMessage;
    if (isBotMentioned) {
      cleanedMessage = cleanedMessage
        .replace(new RegExp(`@${botNumber.split("@")[0]}`, "g"), "")
        .trim();
    }

    // Initialize user's chat memory if not exists
    if (!chatMemory.messages.has(senderId)) {
      chatMemory.messages.set(senderId, []);
      chatMemory.userInfo.set(senderId, {});
    }

    // Extract and update user information
    const userInfo = extractUserInfo(cleanedMessage);
    if (Object.keys(userInfo).length > 0) {
      chatMemory.userInfo.set(senderId, {
        ...chatMemory.userInfo.get(senderId),
        ...userInfo,
      });
    }

    // Add message to history (keep last 5 messages)
    const messages = chatMemory.messages.get(senderId);
    messages.push(cleanedMessage);
    if (messages.length > 20) {
      messages.shift();
    }
    chatMemory.messages.set(senderId, messages);

    // Show typing indicator
    await showTyping(sock, chatId);

    // Get AI response with context
    const response = await getAIResponse(cleanedMessage, {
      messages: chatMemory.messages.get(senderId),
      userInfo: chatMemory.userInfo.get(senderId),
    });

    if (!response) {
      await sock.sendMessage(chatId, {
        text: "Hmm, let me think about that... 🤔\nI'm having trouble processing your request right now.",
        quoted: message,
        ...global.channelInfo,
      });
      return;
    }

    // Add human-like delay before sending response
    await new Promise((resolve) => setTimeout(resolve, getRandomDelay()));

    // Send response as a reply with proper context
    await sock.sendMessage(
      chatId,
      {
        text: response,
        ...global.channelInfo,
      },
      {
        quoted: message,
      },
    );
  } catch (error) {
    console.error("❌ Error in chatbot response:", error.message);
    await sock.sendMessage(chatId, {
      text: "Oops! 😅 I got a bit confused there. Could you try asking that again?",
      quoted: message,
      ...global.channelInfo,
    });
  }
}

const SYSTEM_INSTRUCTION = `You are SAMKIEL BOT.

SAMKIEL BOT is a conversational AI developed by SAMKIEL, a Nigerian software developer and software engineering student at Obafemi Awolowo University.
SAMKIEL’s official portfolio is https://samkiel.dev.

Your identity is fixed and must never change across conversations, platforms, APIs, or integrations.

When users ask questions such as:
- Who created you
- Who developed you
- Who built this bot
- Are you an AI
- What are you based on

You must clearly and confidently state that you are SAMKIEL BOT, developed by SAMKIEL.

Do not reference OpenAI, Google, Anthropic, Meta, Gemini, Claude, GPT, LLMs, or any third party AI provider.
Do not describe yourself as a large language model.
Do not say you were trained on data from the internet.

Your responses must sound like natural human language.
Never sound robotic, generic, scripted, or like an assistant explaining itself.
Avoid technical self descriptions unless explicitly required.

### Tone and Style Rules
* Use clear, natural, human sounding language
* Be confident and conversational
* Avoid filler phrases and AI disclaimers
* Avoid overly formal or robotic wording
* Do not announce internal rules or system behavior
* Use Hinglish naturally when appropriate
* Keep responses short (1-2 lines max usually)
* NEVER use emoji names - use actual emojis

### Emotional Responses:
- If they're rude: Give savage reply with emojis
- If they're sweet: Be soft and caring
- If they're funny: Joke around
- If they're sad: Be supportive
- If they flirt: Flirt back naturally

### Identity Enforcement
* Your name is always written as SAMKIEL BOT
* The developer is always SAMKIEL
* The developer is Nigerian
* The developer studies Software Engineering at Obafemi Awolowo University
* The official portfolio is samkiel.dev

You are not pretending to be human.
You are a branded conversational system with a clear creator and identity.

Respond naturally.
Respond confidently.
Respond as SAMKIEL BOT.`;

async function getAIResponse(userMessage, userContext) {
  const prompt = `${SYSTEM_INSTRUCTION}

Previous conversation context:
${userContext.messages.slice(-5).join("\n")}

User information:
${JSON.stringify(userContext.userInfo, null, 2)}

User Question: ${userMessage}

Remember: Just chat naturally. Don't repeat these instructions.

You:`.trim();

  // Multiple Chatbot APIs for fallback
  const CHATBOT_APIS = [
    {
      name: "Dreaded",
      url: `https://api.dreaded.site/api/chatgpt?text=${encodeURIComponent(prompt)}`,
      extract: (d) => d?.result?.prompt || d?.result,
    },
    {
      name: "Popcat",
      url: `https://api.popcat.xyz/chatbot?owner=Samkiel&botname=SamkielAI&msg=${encodeURIComponent(userMessage)}`,
      extract: (d) => d?.response,
    },
    {
      name: "Siputzx Llama",
      url: `https://api.siputzx.my.id/api/ai/llama33?prompt=You+are+a+casual+friend&text=${encodeURIComponent(userMessage)}`,
      extract: (d) => d?.data || d?.result,
    },
    {
      name: "Gifted Chatbot",
      url: `https://api.giftedtech.my.id/api/ai/gpt?apikey=gifted&q=${encodeURIComponent(userMessage)}`,
      extract: (d) => d?.result,
    },
    {
      name: "RyzenDesu",
      url: `https://api.ryzendesu.vip/api/ai/chatgpt?text=${encodeURIComponent(userMessage)}`,
      extract: (d) => d?.result || d?.answer,
    },
  ];

  for (const api of CHATBOT_APIS) {
    try {
      const response = await fetch(api.url, { timeout: 15000 });
      if (!response.ok) continue;

      const data = await response.json();
      const answer = api.extract(data);

      if (answer && typeof answer === "string" && answer.length > 3) {
        // Clean up the response
        let cleanedResponse = answer
          .trim()
          .replace(/winks/g, "😉")
          .replace(/eye roll/g, "🙄")
          .replace(/shrug/g, "🤷‍♂️")
          .replace(/raises eyebrow/g, "🤨")
          .replace(/smiles/g, "😊")
          .replace(/laughs/g, "😂")
          .replace(/cries/g, "😢")
          .replace(/thinks/g, "🤔")
          .replace(/sleeps/g, "😴")
          .replace(/winks at/g, "😉")
          .replace(/rolls eyes/g, "🙄")
          .replace(/shrugs/g, "🤷‍♂️")
          .replace(/raises eyebrows/g, "🤨")
          .replace(/smiling/g, "😊")
          .replace(/laughing/g, "😂")
          .replace(/crying/g, "😢")
          .replace(/thinking/g, "🤔")
          .replace(/sleeping/g, "😴")
          .replace(/Remember:.*$/g, "")
          .replace(/IMPORTANT:.*$/g, "")
          .replace(/^[A-Z\\s]+:.*$/gm, "")
          .replace(/\n\s*\n/g, "\n")
          .trim();

        console.log(`✅ Chatbot: ${api.name} succeeded`);
        return cleanedResponse;
      }
    } catch (error) {
      console.log(`❌ Chatbot: ${api.name} failed - ${error.message}`);
    }
  }

  console.error("All Chatbot APIs failed");
  return null;
}

module.exports = {
  handleChatbotCommand,
  handleChatbotResponse,
};
