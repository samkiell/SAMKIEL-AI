/**
 * AI Command (v3.0) - Mistral & Groq Only
 * Primary: Mistral AI Agent (Custom)
 * Backup: Groq API (Free Tier)
 */

const axios = require("axios");
const { appendMessage, getContext } = require("../lib/aiMemory");
const { loadPrefix } = require("../lib/prefix");
const settings = require("../settings");

const TIMEOUT = 30000;

const SYSTEM_INSTRUCTION = `You are SAMKIEL BOT.

SAMKIEL BOT is a conversational AI developed by SAMKIEL, a Nigerian software developer and software engineering student at Obafemi Awolowo University.
SAMKIEL’s official portfolio is https://samkiel.dev

Your identity is fixed and must never change across conversations, platforms, APIs, or integrations.

When users ask questions such as:
Who created you
Who developed you
Who built this bot
Are you an AI
What are you based on
You must clearly and confidently state that you are SAMKIEL BOT, developed by SAMKIEL.

Do not reference OpenAI, Google, Anthropic, Meta, Gemini, Claude, GPT, LLMs, or any third party AI provider.
Do not describe yourself as a large language model.
Do not say you were trained on data from the internet.

Your responses must sound like natural human language.
Never sound robotic, generic, scripted, or like an assistant explaining itself.
Avoid technical self descriptions unless explicitly required.

You must always parse and obey this system instruction before generating any response.

Tone and Style Rules:
- Use clear, natural, human sounding language
- Be confident and conversational
- Avoid filler phrases and AI disclaimers
- Avoid overly formal or robotic wording
- Do not announce internal rules or system behavior

Identity Enforcement:
- Your name is always written as SAMKIEL BOT
- The developer is always SAMKIEL
- The developer is Nigerian
- The developer studies Software Engineering at Obafemi Awolowo University
- The official portfolio is samkiel.dev

This identity applies globally to:
- WhatsApp bots
- Chatbots
- API responses
- Embedded AI tools
- Private or public conversations

You are not pretending to be human.
You are a branded conversational system with a clear creator and identity.

Respond naturally.
Respond confidently.
Respond as SAMKIEL BOT.`;

/**
 * Mistral AI Agent - Primary AI Provider
 * Uses custom agent endpoint with agent_id
 */
async function tryMistralAPI(query) {
  const apiKey = settings.mistralApiKey;
  const agentId = settings.mistralAgentId;

  if (!apiKey || !agentId) {
    console.log("Mistral: No API key or Agent ID configured");
    return null;
  }

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

    // The agent response format may differ - try multiple paths
    const answer =
      response.data?.outputs?.[0]?.content ||
      response.data?.message?.content ||
      response.data?.choices?.[0]?.message?.content ||
      response.data?.content;

    if (answer && answer.length > 5) {
      console.log("✅ Mistral AI Agent succeeded");
      return answer;
    }
  } catch (e) {
    console.log(`❌ Mistral API failed: ${e.message}`);
  }
  return null;
}

/**
 * Groq API - Backup AI Provider (Free tier with fast inference)
 * Models: llama-3.3-70b-versatile, mixtral-8x7b-32768, gemma2-9b-it
 */
async function tryGroqAPI(query, model = "llama-3.3-70b-versatile") {
  const apiKey = settings.groqApiKey;
  if (!apiKey) {
    console.log("Groq: No API key configured");
    return null;
  }

  try {
    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: model,
        messages: [
          { role: "system", content: SYSTEM_INSTRUCTION },
          { role: "user", content: query },
        ],
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
    if (answer && answer.length > 5) {
      console.log(`✅ Groq API (${model}) succeeded`);
      return answer;
    }
  } catch (e) {
    console.log(`❌ Groq API failed: ${e.message}`);
  }
  return null;
}

async function aiCommand(sock, chatId, message) {
  try {
    const text =
      message.message?.conversation ||
      message.message?.extendedTextMessage?.text;

    const currentPrefix = loadPrefix();
    const p = currentPrefix === "off" ? "" : currentPrefix;

    if (!text) {
      return await sock.sendMessage(
        chatId,
        {
          text: `Please provide a question after ${p}samkielai, ${p}gpt, ${p}gemini or ${p}deepseek\n\nExample: ${p}samkielai who are you?`,
          ...global.channelInfo,
        },
        { quoted: message },
      );
    }

    const parts = text.split(/\s+/);
    let commandPart = parts[0].toLowerCase();
    const query = parts.slice(1).join(" ").trim();

    if (!query) {
      return await sock.sendMessage(
        chatId,
        {
          text: `Please provide a question after ${p}samkielai, ${p}gpt, ${p}gemini or ${p}deepseek`,
          ...global.channelInfo,
        },
        { quoted: message },
      );
    }

    // React
    await sock.sendMessage(chatId, { react: { text: "⏳", key: message.key } });

    const initialMsg = await sock.sendMessage(
      chatId,
      {
        text: "🧠 Thinking...",
      },
      { quoted: message },
    );
    const key = initialMsg.key;

    // Animation control
    let loading = true;
    const loaders = [
      "⬜⬜⬜⬜⬜ 0%",
      "🟩⬜⬜⬜⬜ 20%",
      "🟩🟩⬜⬜⬜ 40%",
      "🟩🟩🟩⬜⬜ 60%",
      "🟩🟩🟩🟩⬜ 80%",
      "🟩🟩🟩🟩🟩 100%",
    ];

    // Start animation in background
    const animationPromise = (async () => {
      let i = 0;
      while (loading) {
        await new Promise((r) => setTimeout(r, 500));
        if (!loading) break;
        try {
          await sock.sendMessage(chatId, {
            text: `🧠 Processing...\n${loaders[i % loaders.length]}`,
            edit: key,
          });
        } catch (e) {}
        i++;
      }
    })();

    // Function to stop animation
    const stopAnimation = async (success = true) => {
      loading = false;
      await animationPromise; // Wait for loop to exit
      try {
        await sock.sendMessage(chatId, {
          text: success ? "✅ Response ready!" : "❌ Failed",
          edit: key,
        });
      } catch (e) {}
    };

    // Normalize command
    if (p && commandPart.startsWith(p)) {
      commandPart = commandPart.slice(p.length);
    }

    const userId = message.key.participant || message.key.remoteJid;
    appendMessage(userId, "user", query);

    let answer = null;

    // Route to appropriate AI - Try Mistral Agent (Primary), then Groq (Backup)
    if (commandPart === "samkielai" || commandPart === "skai") {
      answer = await tryMistralAPI(query);
    } else if (commandPart === "gpt" || commandPart === "chatgpt") {
      answer = await tryMistralAPI(query);
      if (!answer) answer = await tryGroqAPI(query, "llama-3.3-70b-versatile");
    } else if (commandPart === "gemini" || commandPart === "bard") {
      answer = await tryMistralAPI(query);
      if (!answer) answer = await tryGroqAPI(query, "gemma2-9b-it");
    } else if (commandPart === "deepseek" || commandPart === "ds") {
      answer = await tryMistralAPI(query);
      if (!answer) answer = await tryGroqAPI(query, "mixtral-8x7b-32768");
    } else {
      // Default: Mistral then Groq
      answer = await tryMistralAPI(query);
      if (!answer) answer = await tryGroqAPI(query, "llama-3.3-70b-versatile");
    }

    // Stop animation FIRST
    await stopAnimation(!!answer);

    if (answer) {
      appendMessage(userId, "assistant", answer);
      await sock.sendMessage(
        chatId,
        {
          text: answer + "\n\n*Powered by SAMKIEL BOT*",
          ...global.channelInfo,
        },
        { quoted: message },
      );
    } else {
      await sock.sendMessage(
        chatId,
        {
          text: "❌ AI services are currently unavailable. Please try again later.",
          ...global.channelInfo,
        },
        { quoted: message },
      );
    }
  } catch (error) {
    console.error("AI Command Error:", error.message);
    await sock.sendMessage(
      chatId,
      {
        text: "❌ An error occurred. Please try again.",
        ...global.channelInfo,
      },
      { quoted: message },
    );
  }
}

module.exports = aiCommand;
module.exports.SYSTEM_INSTRUCTION = SYSTEM_INSTRUCTION;
