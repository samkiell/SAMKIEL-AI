/**
 * Math Command Handler
 * Routes math problems to DeepSeek API for step-by-step solutions
 */

const axios = require("axios");
const { loadPrefix } = require("../lib/prefix");
const {
  formatMathSolution,
  getMathSystemPrompt,
  isMathProblem,
} = require("../lib/mathSolver");

const TIMEOUT = 30000;

// Get the math system prompt once (static)
const MATH_SYSTEM_PROMPT = getMathSystemPrompt();

/**
 * DeepSeek API Endpoints optimized for mathematical reasoning
 */
const MATH_APIS = [
  {
    name: "Vreden DeepSeek",
    url: (q) =>
      `https://api.vreden.my.id/api/ai/deepseek?query=${encodeURIComponent(MATH_SYSTEM_PROMPT + "\n\nProblem: " + q)}`,
    extract: (d) => d?.result?.response || d?.result,
  },
  {
    name: "Widipe DeepSeek",
    url: (q) =>
      `https://widipe.com.pl/ai/deepseek?text=${encodeURIComponent(MATH_SYSTEM_PROMPT + "\n\nProblem: " + q)}`,
    extract: (d) => d?.result,
  },
  {
    name: "JIKAN MOEAPI",
    url: (q) =>
      `https://jikan.moeapi.net/v1/deepseek?q=${encodeURIComponent(MATH_SYSTEM_PROMPT + "\n\nProblem: " + q)}`,
    extract: (d) => d?.result || d?.answer,
  },
  {
    name: "Gifted DeepSeek",
    url: (q) =>
      `https://api.giftedtech.my.id/api/ai/deepseek?apikey=gifted&q=${encodeURIComponent(MATH_SYSTEM_PROMPT + "\n\nProblem: " + q)}`,
    extract: (d) => d?.result,
  },
  {
    name: "Siputzx DeepSeek",
    url: (q) =>
      `https://api.siputzx.my.id/api/ai/deepseek?prompt=${encodeURIComponent(MATH_SYSTEM_PROMPT + "\n\nProblem: " + q)}`,
    extract: (d) => d?.data || d?.result,
  },
  {
    name: "RyzenDesu DeepSeek",
    url: (q) =>
      `https://api.ryzendesu.vip/api/ai/deepseek?text=${encodeURIComponent(MATH_SYSTEM_PROMPT + "\n\nProblem: " + q)}`,
    extract: (d) => d?.result || d?.answer,
  },
  {
    name: "Qewertyy DeepSeek",
    url: (q) =>
      `https://api.qewertyy.dev/models?model_id=26&prompt=${encodeURIComponent(MATH_SYSTEM_PROMPT + "\n\nProblem: " + q)}`,
    extract: (d) => d?.content || d?.result,
  },
];

/**
 * Try multiple DeepSeek APIs with fallback
 */
async function tryMathApis(problem) {
  for (const api of MATH_APIS) {
    try {
      const response = await axios.get(api.url(problem), { timeout: TIMEOUT });
      const answer = api.extract(response.data);

      if (answer && typeof answer === "string" && answer.length > 10) {
        console.log(`✅ Math: ${api.name} succeeded`);
        return answer;
      }
    } catch (e) {
      console.log(`❌ Math: ${api.name} failed - ${e.message}`);
    }
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

    // Validate it looks like a math problem
    if (!isMathProblem(problem)) {
      return await sock.sendMessage(
        chatId,
        {
          text: `⚠️ This doesn't look like a math problem.\n\nPlease provide a mathematical expression, equation, or problem.\n\nExamples:\n${p}math 2x + 5 = 15\n${p}cal 25 × 4 + 10\n${p}solve x² - 5x + 6 = 0`,
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

    // Get solution from DeepSeek APIs
    const rawSolution = await tryMathApis(problem);

    // Stop animation
    await stopAnimation(!!rawSolution);

    if (rawSolution) {
      // Format the solution for WhatsApp
      const formattedSolution = formatMathSolution(rawSolution);

      // Send the formatted solution
      await sock.sendMessage(
        chatId,
        {
          text: `📐 *Math Solution*\n\n${formattedSolution}`,
          ...global.channelInfo,
        },
        { quoted: message },
      );
    } else {
      await sock.sendMessage(
        chatId,
        {
          text: "❌ All math APIs failed. Please try again later or rephrase your problem.",
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
