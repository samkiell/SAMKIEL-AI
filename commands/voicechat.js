/**
 * Voice Chat Toggle & Configuration Command
 * Handles persistent voice parameters: status, voice, speed, lang
 */

const fs = require("fs");
const path = require("path");
const { isOwner } = require("../lib/isOwner");
const {
  getBotVoiceInfo,
  getAvailableVoices,
  saveVoiceConfig,
  loadVoiceConfig,
  AVAILABLE_VOICES,
} = require("../lib/voiceConfig");

const STATUS_PATH = path.join(__dirname, "../data/voiceChat.json");

/**
 * Load voice chat enable/disable status
 */
function loadStatus() {
  try {
    if (fs.existsSync(STATUS_PATH)) {
      return JSON.parse(fs.readFileSync(STATUS_PATH, "utf8"));
    }
  } catch (e) {}
  return { enabled: false };
}

/**
 * Save voice chat enable/disable status
 */
function saveStatus(status) {
  try {
    fs.writeFileSync(STATUS_PATH, JSON.stringify(status, null, 2));
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Voice Chat Command Handler
 */
async function voiceChatCommand(sock, chatId, message, args) {
  // Centralized check: only owner
  // Handled in main.js but added safety here
  const senderId = message.key.participant || message.key.remoteJid;
  if (!(await isOwner(senderId, sock, message.key))) {
    return; // Silently ignore or send error if not owner
  }

  const subCmd = args[0]?.toLowerCase();
  const status = loadStatus();
  const config = loadVoiceConfig() || {};

  if (!subCmd || subCmd === "status") {
    const isEnabled = status.enabled ? "✅ ON" : "❌ OFF";
    const voice = config.voice || "Default";
    const speed = config.speed || 1.0;
    const lang = config.lang || "en-ng";

    return await sock.sendMessage(chatId, {
      text:
        `🎤 *VOICE CHAT SETTINGS*\n\n` +
        `• Status: ${isEnabled}\n` +
        `• Active Voice: ${voice}\n` +
        `• Speech Speed: ${speed}x\n` +
        `• Language: ${lang}\n\n` +
        `*Commands:*\n` +
        `.voicechat on / off\n` +
        `.voicechat voice <name>\n` +
        `.voicechat speed <0.5 to 2.0>\n` +
        `.voicechat lang <code>\n` +
        `.voicechat voices (list choices)`,
    });
  }

  if (subCmd === "on") {
    status.enabled = true;
    saveStatus(status);
    return await sock.sendMessage(chatId, {
      text: "✅ Voice Chat enabled. I will now respond with audio.",
    });
  }

  if (subCmd === "off") {
    status.enabled = false;
    saveStatus(status);
    return await sock.sendMessage(chatId, {
      text: "❌ Voice Chat disabled. Back to text-only mode.",
    });
  }

  if (subCmd === "voice" || subCmd === "setvoice") {
    const name = args[1];
    if (!name)
      return await sock.sendMessage(chatId, {
        text: "❌ Please provide a voice name. Use `.voicechat voices` to see the list.",
      });

    const voice = AVAILABLE_VOICES.find(
      (v) => v.id.toLowerCase() === name.toLowerCase(),
    );
    if (!voice)
      return await sock.sendMessage(chatId, {
        text: `❌ Voice "${name}" not found.`,
      });

    config.voice = voice.id;
    config.gender = voice.gender;
    config.description = voice.description;
    saveVoiceConfig(config);
    return await sock.sendMessage(chatId, {
      text: `✅ Voice changed to: *${voice.id}* (${voice.description})`,
    });
  }

  if (subCmd === "voices" || subCmd === "list") {
    const list = AVAILABLE_VOICES.map(
      (v) => `• *${v.id}* (${v.description})`,
    ).join("\n");
    return await sock.sendMessage(chatId, {
      text: `🎤 *AVAILABLE VOICES*\n\n${list}`,
    });
  }

  if (subCmd === "speed") {
    const val = parseFloat(args[1]);
    if (isNaN(val) || val < 0.5 || val > 2.0) {
      return await sock.sendMessage(chatId, {
        text: "❌ Provide speed between 0.5 and 2.0 (e.g., .voicechat speed 1.2)",
      });
    }
    config.speed = val;
    saveVoiceConfig(config);
    return await sock.sendMessage(chatId, {
      text: `✅ Speech speed set to: *${val}x*`,
    });
  }

  if (subCmd === "lang") {
    const code = args[1]?.toLowerCase();
    if (!code)
      return await sock.sendMessage(chatId, {
        text: "❌ Please provide a language code (e.g., en-ng, en-us, fr-fr).",
      });

    config.lang = code;
    saveVoiceConfig(config);
    return await sock.sendMessage(chatId, {
      text: `✅ Voice language set to: *${code}*`,
    });
  }

  await sock.sendMessage(chatId, {
    text: "❌ Unknown command. Use `.voicechat status` to see available options.",
  });
}

module.exports = {
  voiceChatCommand,
  isVoiceChatEnabled: () => loadStatus().enabled,
  loadVoiceChatConfig: loadStatus,
  saveVoiceChatConfig: saveStatus,
};
