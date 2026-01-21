/**
 * Voice Config Module
 * Handles persistent voice selection for the bot
 *
 * This ensures each bot deployment has a consistent voice
 * that persists across restarts, updates, and sessions.
 */

const fs = require("fs");
const path = require("path");

const CONFIG_PATH = path.join(__dirname, "../data/botVoice.json");

// Available voices for Yarn AI TTS (Nigerian accents)
const AVAILABLE_VOICES = [
  { id: "Idera", gender: "female", description: "Nigerian Female" },
  { id: "Emma", gender: "male", description: "Nigerian Male" },
  { id: "Zainab", gender: "female", description: "Nigerian Female" },
  { id: "Osagie", gender: "male", description: "Nigerian Male" },
  { id: "Wura", gender: "female", description: "Nigerian Female" },
  { id: "Jude", gender: "male", description: "Nigerian Male" },
  { id: "Chinenye", gender: "female", description: "Nigerian Female" },
  { id: "Tayo", gender: "male", description: "Nigerian Male" },
];

// Backup voices for fallback TTS APIs
const FALLBACK_VOICES = {
  streamElements: {
    female: "Ezinne",
    male: "Abeo",
  },
  voicerss: {
    locale: "en-ng", // Nigerian English
  },
  google: {
    locale: "en-gb",
  },
};

/**
 * Load voice config from file
 * @returns {Object} Config object with voice settings
 */
function loadVoiceConfig() {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const data = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));
      // Validate that the voice exists
      if (data.voice && AVAILABLE_VOICES.some((v) => v.id === data.voice)) {
        return data;
      }
    }
  } catch (e) {
    console.error("[VoiceConfig] Error loading config:", e.message);
  }
  return null;
}

/**
 * Save voice config to file
 * @param {Object} config - Config object to save
 * @returns {boolean} Success status
 */
function saveVoiceConfig(config) {
  try {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
    console.log(`[VoiceConfig] Saved voice config: ${config.voice}`);
    return true;
  } catch (e) {
    console.error("[VoiceConfig] Error saving config:", e.message);
    return false;
  }
}

/**
 * Randomly select a voice from the available pool
 * @returns {string} Voice ID
 */
function selectRandomVoice() {
  const index = Math.floor(Math.random() * AVAILABLE_VOICES.length);
  return AVAILABLE_VOICES[index].id;
}

/**
 * Get the persistent voice for this deployment
 * If no voice is assigned, select one and save it
 *
 * This is the main function to use for getting the bot's voice
 * @returns {string} The assigned voice ID
 */
function getBotVoice() {
  let config = loadVoiceConfig();

  // If no valid config exists, create one
  if (!config || !config.voice) {
    const selectedVoice = selectRandomVoice();
    const selectedVoiceInfo = AVAILABLE_VOICES.find(
      (v) => v.id === selectedVoice,
    );

    config = {
      voice: selectedVoice,
      gender: selectedVoiceInfo?.gender || "unknown",
      description: selectedVoiceInfo?.description || "AI Voice",
      assignedAt: new Date().toISOString(),
      note: "This voice is permanently assigned to this bot deployment. Do not modify.",
    };

    saveVoiceConfig(config);
    console.log(
      `[VoiceConfig] Assigned new voice: ${selectedVoice} (${selectedVoiceInfo?.description})`,
    );
  }

  return config.voice;
}

/**
 * Get voice info for the current bot
 * @returns {Object} Voice info including id, gender, description
 */
function getBotVoiceInfo() {
  const voiceId = getBotVoice();
  const voiceInfo = AVAILABLE_VOICES.find((v) => v.id === voiceId);
  return {
    id: voiceId,
    gender: voiceInfo?.gender || "unknown",
    description: voiceInfo?.description || "AI Voice",
  };
}

/**
 * Get fallback voice based on the bot's assigned voice gender
 * Used when primary TTS (Yarn AI) fails
 * @returns {Object} Fallback voice settings for each API
 */
function getFallbackVoice() {
  const voiceInfo = getBotVoiceInfo();
  const gender = voiceInfo.gender;

  return {
    streamElements:
      gender === "female"
        ? FALLBACK_VOICES.streamElements.female
        : FALLBACK_VOICES.streamElements.male,
    voicerss: FALLBACK_VOICES.voicerss,
    google: FALLBACK_VOICES.google,
  };
}

/**
 * Force re-assign a new voice (for admin use only)
 * This should rarely be used - only if voice needs to change
 * @returns {string} The new voice ID
 */
function reassignVoice() {
  const selectedVoice = selectRandomVoice();
  const selectedVoiceInfo = AVAILABLE_VOICES.find(
    (v) => v.id === selectedVoice,
  );

  const config = {
    voice: selectedVoice,
    gender: selectedVoiceInfo?.gender || "unknown",
    description: selectedVoiceInfo?.description || "AI Voice",
    assignedAt: new Date().toISOString(),
    reassignedAt: new Date().toISOString(),
    note: "This voice is permanently assigned to this bot deployment.",
  };

  saveVoiceConfig(config);
  console.log(`[VoiceConfig] Re-assigned voice to: ${selectedVoice}`);
  return selectedVoice;
}

/**
 * Get the list of available voices
 * @returns {Array} List of available voice objects
 */
function getAvailableVoices() {
  return AVAILABLE_VOICES;
}

/**
 * Get the full voice settings including speed and language
 * @returns {Object} Settings object
 */
function getVoiceSettings() {
  let config = loadVoiceConfig();
  if (!config) {
    getBotVoice(); // Initialize defaults
    config = loadVoiceConfig();
  }
  return {
    voice: config.voice,
    gender: config.gender,
  };
}

module.exports = {
  getBotVoice,
  getBotVoiceInfo,
  getVoiceSettings,
  getFallbackVoice,
  getAvailableVoices,
  reassignVoice,
  loadVoiceConfig,
  saveVoiceConfig,
  AVAILABLE_VOICES,
  FALLBACK_VOICES,
};
