/**
 * Math Command Handler
 * Routes math problems to Mistral AI Agent for step-by-step solutions
 * Backup: Groq API
 */

const axios = require("axios");
const { loadPrefix } = require("../lib/prefix");
const settings = require("../settings");
const {
  formatMathSolution,
  getMathSystemPrompt,
  isMathProblem,
} = require("../lib/mathSolver");

const TIMEOUT = 30000;

// Get the math system prompt once (static)
const MATH_SYSTEM_PROMPT = getMathSystemPrompt();

/**
 * Mistral AI Agent - Primary Math Solver
 */
async function tryMistralMath(problem) {
  const apiKey = settings.mistralApiKey;
  const agentId = settings.mistralAgentId;

  if (!apiKey || !agentId) return null;

  try {
    const response = await axios.post(
      "https://api.mistral.ai/v1/conversations",
      {
        agent_id: agentId,
        inputs: [
          {
            role: "user",
            content: `${MATH_SYSTEM_PROMPT}\n\nPlease solve this math problem step-by-step:\n\n${problem}`,
          },
        ],
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
      response.data?.content;

    if (answer && answer.length > 10) {
      console.log("✅ Math: Mistral AI Agent succeeded");
      return answer;
    }
  } catch (e) {
    console.log(`❌ Math: Mistral API failed: ${e.message}`);
  }
  return null;
}

/**
 * Groq API - Backup Math Solver
 */
async function tryGroqMath(problem) {
  const apiKey = settings.groqApiKey;
  if (!apiKey) return null;

  try {
    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: MATH_SYSTEM_PROMPT },
          {
            role: "user",
            content: `Please solve this math problem step-by-step:\n\n${problem}`,
          },
        ],
        temperature: 0.1, // Lower temperature for more accurate math
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
    if (answer && answer.length > 10) {
      console.log("✅ Math: Groq API succeeded");
      return answer;
    }
  } catch (e) {
    console.log(`❌ Math: Groq API failed: ${e.message}`);
  }
  return null;
}

/**
 * Main math command handler
 */
async function mathCommand(sock, chatId, message) {
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
          text: `📐 *Math Solver*\n\nPlease provide a math problem to solve.\n\nExamples:\n${p}math 2x + 5 = 15\n${p}cal 25 × 4 + 10\n${p}solve x² - 5x + 6 = 0`,
          ...global.channelInfo,
        },
        { quoted: message },
      );
    }

    // Extract the math problem (remove command prefix)
    const parts = text.split(/\s+/);
    const problem = parts.slice(1).join(" ").trim();

    if (!problem) {
      return await sock.sendMessage(
        chatId,
        {
          text: `📐 *Math Solver*\n\nPlease provide a math problem to solve.\n\nExamples:\n${p}math 2x + 5 = 15\n${p}cal 25 × 4 + 10\n${p}solve x² - 5x + 6 = 0`,
          ...global.channelInfo,
        },
        { quoted: message },
      );
    }

    // React to show processing
    await sock.sendMessage(chatId, { react: { text: "🧮", key: message.key } });

    // Send initial processing message
    const initialMsg = await sock.sendMessage(
      chatId,
      {
        text: "📐 Solving your math problem...",
      },
      { quoted: message },
    );
    const key = initialMsg.key;

    // Animation control
    let loading = true;
    const loaders = [
      "⬜⬜⬜⬜⬜ 0%",
      "🟦⬜⬜⬜⬜ 20%",
      "🟦🟦⬜⬜⬜ 40%",
      "🟦🟦🟦⬜⬜ 60%",
      "🟦🟦🟦🟦⬜ 80%",
      "🟦🟦🟦🟦🟦 100%",
    ];

    // Start animation in background
    const animationPromise = (async () => {
      let i = 0;
      while (loading) {
        await new Promise((r) => setTimeout(r, 500));
        if (!loading) break;
        try {
          await sock.sendMessage(chatId, {
            text: `📐 Calculating...\n${loaders[i % loaders.length]}`,
            edit: key,
          });
        } catch (e) {}
        i++;
      }
    })();

    // Stop animation helper
    const stopAnimation = async (success = true) => {
      loading = false;
      await animationPromise;
      try {
        await sock.sendMessage(chatId, {
          text: success ? "✅ Solution ready!" : "❌ Failed",
          edit: key,
        });
      } catch (e) {}
    };

    // Get solution - Try Mistral then Groq
    let rawSolution = await tryMistralMath(problem);
    if (!rawSolution) rawSolution = await tryGroqMath(problem);

    // Stop animation
    await stopAnimation(!!rawSolution);

    if (rawSolution) {
      // Format the solution for WhatsApp
      const formattedSolution = formatMathSolution(rawSolution);

      // Send the formatted solution
      await sock.sendMessage(
        chatId,
        {
          text: `📐 *Math Solution*\n\n${formattedSolution}\n\n*Powered by SAMKIEL BOT*`,
          ...global.channelInfo,
        },
        { quoted: message },
      );
    } else {
      await sock.sendMessage(
        chatId,
        {
          text: "❌ Math services are currently unavailable. Please try again later.",
          ...global.channelInfo,
        },
        { quoted: message },
      );
    }
  } catch (error) {
    console.error("Math Command Error:", error.message);
    await sock.sendMessage(
      chatId,
      {
        text: "❌ An error occurred while solving the problem. Please try again.",
        ...global.channelInfo,
      },
      { quoted: message },
    );
  }
}

module.exports = mathCommand;
