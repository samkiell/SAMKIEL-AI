/**
 * Voice Chat Toggle Command
 * Allows owners to enable/disable automatic voice note processing
 */

const fs = require("fs");
const path = require("path");
const { isOwner, isSuperOwner } = require("../lib/isOwner");

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
 * Voice Chat Toggle Command Handler
 */
async function voiceChatCommand(sock, chatId, message, args) {
  const senderId = message.key.participant || message.key.remoteJid;

  // Only owners can toggle voice chat
  const ownerCheck = await isOwner(senderId, sock);
  const superCheck = isSuperOwner(senderId);

  if (!ownerCheck && !superCheck) {
    await sock.sendMessage(chatId, {
      text: "❌ Only bot owners can toggle voice chat mode.",
    });
    return;
  }

  const subCmd = args[0]?.toLowerCase();
  const config = loadVoiceChatConfig();

  if (subCmd === "on") {
    config.enabled = true;
    if (saveVoiceChatConfig(config)) {
      await sock.sendMessage(chatId, {
        text: "🎤 *Voice Chat Mode ENABLED*\n\nThe bot will now:\n• Process incoming voice notes\n• Transcribe audio\n• Generate AI responses\n• Reply with voice + text",
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
  } else {
    // Show status
    const status = config.enabled ? "✅ ON" : "❌ OFF";
    await sock.sendMessage(chatId, {
      text: `🎤 *Voice Chat Status*\n\nCurrent: ${status}\n\n*Usage:*\n.voicechat on - Enable voice responses\n.voicechat off - Disable voice responses\n\n_When enabled, the bot will automatically respond to voice notes with AI-generated voice replies._`,
    });
  }
}

module.exports = {
  voiceChatCommand,
  isVoiceChatEnabled,
  loadVoiceChatConfig,
  saveVoiceChatConfig,
};
