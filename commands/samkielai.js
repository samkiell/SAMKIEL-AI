/**
 * SAMKIEL AI Command
 * Powered by Mistral AI Voice Agent (Custom Agent)
 */

const axios = require("axios");
const settings = require("../settings");
const { appendMessage } = require("../lib/aiMemory");
const { loadPrefix } = require("../lib/prefix");

const TIMEOUT = 30000;

async function samkielaiCommand(sock, chatId, message) {
  console.log(`🤖 samkielaiCommand triggered in ${chatId}`);
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
          text: `Please provide a question.\n\nExample: ${p}samkielai who are you?`,
        },
        { quoted: message },
      );
    }

    const parts = (text || "").split(/\s+/);
    const commandName = parts[0].replace(p, "").toLowerCase();
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

    if (!query) {
      return await sock.sendMessage(
        chatId,
        {
          text: `Please provide a question or reply to a message.\n\nExample: ${p}samkielai who are you?`,
        },
        { quoted: message },
      );
    }

    // React to show thinking
    await sock.sendMessage(chatId, { react: { text: "⏳", key: message.key } });

    // Send thinking message
    const initialMsg = await sock.sendMessage(
      chatId,
      { text: "🧠 *SAMKIEL AI is thinking...*" },
      { quoted: message },
    );
    const key = initialMsg.key;

    // Animation frames
    const loaders = [
      "⬜⬜⬜⬜⬜ 0%",
      "🟩⬜⬜⬜⬜ 20%",
      "🟩🟩⬜⬜⬜ 40%",
      "🟩🟩🟩⬜⬜ 60%",
      "🟩🟩🟩🟩⬜ 80%",
      "🟩🟩🟩🟩🟩 100%",
    ];
    let loading = true;

    const animation = (async () => {
      let i = 0;
      while (loading) {
        await new Promise((r) => setTimeout(r, 600));
        if (!loading) break;
        try {
          await sock.sendMessage(chatId, {
            text: `🧠 *SAMKIEL AI is processing...*\n${loaders[i % loaders.length]}`,
            edit: key,
          });
        } catch (e) {}
        i++;
      }
    })();

    const stopAnimation = async () => {
      loading = false;
      await animation;
    };

    const apiKey = settings.mistralApiKey;
    const agentId = settings.mistralAgentId;

    if (!apiKey || !agentId) {
      await stopAnimation();
      return await sock.sendMessage(chatId, {
        text: "❌ AI Credentials missing. Please check settings.js",
        edit: key,
      });
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

      const answer =
        response.data?.outputs?.[0]?.content ||
        response.data?.message?.content ||
        response.data?.choices?.[0]?.message?.content ||
        response.data?.content;

      await stopAnimation();

      if (answer && answer.length > 2) {
        const userId = message.key.participant || message.key.remoteJid;
        appendMessage(userId, "assistant", answer);

        await sock.sendMessage(chatId, {
          text: answer + "\n\n*Powered by SAMKIEL BOT*",
          edit: key,
        });
      } else {
        await sock.sendMessage(chatId, {
          text: "❌ AI returned an empty response. Please try again.",
          edit: key,
        });
      }
    } catch (e) {
      console.error("SAMKIEL AI Error:", e.message);
      await stopAnimation();
      await sock.sendMessage(chatId, {
        text: `❌ AI Error: ${e.message}`,
        edit: key,
      });
    }
  } catch (error) {
    console.error("SAMKIEL AI Fatal Error:", error);
  }
}

module.exports = samkielaiCommand;
