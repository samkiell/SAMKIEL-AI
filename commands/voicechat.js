/**
 * Voice Chat Toggle Command
 * Allows owners to enable/disable automatic voice note processing
 * Also allows changing the bot's voice
 */

const fs = require("fs");
const path = require("path");
const { isOwner, isSuperOwner } = require("../lib/isOwner");
const {
  getBotVoiceInfo,
  getAvailableVoices,
  reassignVoice,
  saveVoiceConfig,
  loadVoiceConfig,
  AVAILABLE_VOICES,
} = require("../lib/voiceConfig");

const CONFIG_PATH = path.join(__dirname, "../data/voiceChat.json");

/**
 * Load voice chat config
 */
function loadVoiceChatConfig() {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      return JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));
    }
  } catch (e) {
    console.error("Error loading voiceChat.json:", e);
  }
  // Default: voice chat OFF
  return { enabled: false };
}

/**
 * Save voice chat config
 */
function saveVoiceChatConfig(config) {
  try {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
    return true;
  } catch (e) {
    console.error("Error saving voiceChat.json:", e);
    return false;
  }
}

/**
 * Check if voice chat is enabled
 */
function isVoiceChatEnabled() {
  const config = loadVoiceChatConfig();
  return config.enabled === true;
}

/**
 * Set a specific voice for the bot
 */
function setSpecificVoice(voiceName) {
  const voice = AVAILABLE_VOICES.find(
    (v) => v.id.toLowerCase() === voiceName.toLowerCase(),
  );
  if (!voice) return null;

  const config = {
    voice: voice.id,
    gender: voice.gender,
    description: voice.description,
    assignedAt: new Date().toISOString(),
    note: "This voice is permanently assigned to this bot deployment.",
  };

  const voiceConfigPath = path.join(__dirname, "../data/botVoice.json");
  try {
    fs.writeFileSync(voiceConfigPath, JSON.stringify(config, null, 2));
    console.log(`[VoiceConfig] Set voice to: ${voice.id}`);
    return voice;
  } catch (e) {
    console.error("Error saving voice config:", e);
    return null;
  }
}

/**
 * Voice Chat Toggle Command Handler
 */
async function voiceChatCommand(sock, chatId, message, args) {
  // Note: Owner check is already done in main.js via ownerOnlyCommands array
  // No need to duplicate the check here

  const subCmd = args[0]?.toLowerCase();
  const config = loadVoiceChatConfig();

  // Get the bot's persistent voice info
  const voiceInfo = getBotVoiceInfo();

  if (subCmd === "on") {
    config.enabled = true;
    if (saveVoiceChatConfig(config)) {
      await sock.sendMessage(chatId, {
        text: `🎤 *Voice Chat Mode ENABLED*\n\n*Assigned Voice:* ${voiceInfo.id} (${voiceInfo.description})\n\nThe bot will now:\n• Process incoming voice notes\n• Transcribe audio\n• Generate AI responses\n• Reply with voice + text`,
      });
    } else {
      await sock.sendMessage(chatId, {
        text: "❌ Failed to enable voice chat mode.",
      });
    }
  } else if (subCmd === "off") {
    config.enabled = false;
    if (saveVoiceChatConfig(config)) {
      await sock.sendMessage(chatId, {
        text: "🔇 *Voice Chat Mode DISABLED*\n\nThe bot will now ignore incoming voice notes.",
      });
    } else {
      await sock.sendMessage(chatId, {
        text: "❌ Failed to disable voice chat mode.",
      });
    }
  } else if (subCmd === "setvoice" || subCmd === "set") {
    // Change the bot's voice
    const voiceName = args[1];

    if (!voiceName) {
      // List available voices
      const voices = getAvailableVoices();
      const voiceList = voices
        .map((v) => `• *${v.id}* - ${v.description}`)
        .join("\n");

      await sock.sendMessage(chatId, {
        text: `🎤 *Available Voices*\n\nCurrent: *${voiceInfo.id}* (${voiceInfo.description})\n\n${voiceList}\n\n*Usage:*\n.voicechat setvoice <name>\n.voicechat setvoice random\n\n_Example: .voicechat setvoice Idera_`,
      });
      return;
    }

    if (voiceName.toLowerCase() === "random") {
      // Assign random voice
      const newVoice = reassignVoice();
      const newInfo = AVAILABLE_VOICES.find((v) => v.id === newVoice);
      await sock.sendMessage(chatId, {
        text: `🎲 *Voice Changed (Random)*\n\nNew Voice: *${newVoice}* (${newInfo?.description || "AI Voice"})\n\n_This voice will persist across restarts._`,
      });
    } else {
      // Set specific voice
      const result = setSpecificVoice(voiceName);
      if (result) {
        await sock.sendMessage(chatId, {
          text: `✅ *Voice Changed*\n\nNew Voice: *${result.id}* (${result.description})\n\n_This voice will persist across restarts._`,
        });
      } else {
        const voices = getAvailableVoices();
        const voiceNames = voices.map((v) => v.id).join(", ");
        await sock.sendMessage(chatId, {
          text: `❌ Voice "${voiceName}" not found.\n\n*Available voices:*\n${voiceNames}`,
        });
      }
    }
  } else if (subCmd === "voices" || subCmd === "list") {
    // List available voices
    const voices = getAvailableVoices();
    const voiceList = voices
      .map((v) => `• *${v.id}* - ${v.description}`)
      .join("\n");

    await sock.sendMessage(chatId, {
      text: `🎤 *Available Voices*\n\nCurrent: *${voiceInfo.id}* (${voiceInfo.description})\n\n${voiceList}\n\n*To change:*\n.voicechat setvoice <name>`,
    });
  } else {
    // Show status including voice info
    const status = config.enabled ? "✅ ON" : "❌ OFF";
    await sock.sendMessage(chatId, {
      text: `🎤 *Voice Chat Status*\n\nStatus: ${status}\nVoice: *${voiceInfo.id}* (${voiceInfo.description})\n\n*Commands:*\n.voicechat on - Enable voice responses\n.voicechat off - Disable voice responses\n.voicechat setvoice <name> - Change voice\n.voicechat voices - List available voices`,
    });
  }
}

module.exports = {
  voiceChatCommand,
  isVoiceChatEnabled,
  loadVoiceChatConfig,
  saveVoiceChatConfig,
};
