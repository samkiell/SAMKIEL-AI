const fs = require("fs");
const path = require("path");

const settingsPath = path.join(__dirname, "data/settings.json");

/**
 * DEFAULT SETTINGS
 * These act as a fallback and are used for new deployments.
 */
const defaults = {
  // --- IDENTITY ---
  botName: "SAMKIEL BOT",
  prefix: ".",
  botNumber: "",
  ownerNumber: "",
  ownerName: "",

  // --- CREDITS ---
  author: "𝕊𝔸𝕄𝕂𝕀𝔼𝕃 𝔹𝕆𝕋",
  packname: "𝕊𝔸𝕄𝕂𝕀𝔼𝕃 𝔹𝕆𝕋",
  developer: "ѕαмкιєℓ.∂єν",
  portfolio: "https://samkiel.dev",
  website: "https://samkielbot.app",
  description: "Whatsapp Bot",
  version: "2.3.8",

  // --- FEATURE TOGGLES ---
  featureToggles: {
    AUTO_STATUS_VIEW: "on",
    STATUS_VIEW_MSG: "off",
    ENABLE_STATUS_REACTION: true,
    ANTI_DELETE: true,
    SEND_READ: false,
    ALWAYS_ONLINE: true,
    REJECT_CALL: false,
    PERSONAL_MESSAGE: false,
    DISABLE_START_MESSAGE: false,
    AUTO_REACTION: false,
    STATUS_VIEW_EMOJI: "💚",
    ANTI_DELETE_TYPE: "group",
    COMMAND_MODE: "private",
    VOICE_CHAT: false,
    PACKNAME: "𝕊𝔸𝕄𝕂𝕀𝔼𝕃 𝔹𝕆𝕋",
  },

  // --- INTERNAL ---
  giphyApiKey: "qnl7ssQChTdPjsKta2Ax2LMaGXz303tq",
  updateZipUrl:
    "https://github.com/samkiell/SAMKIEL-AI/archive/refs/heads/main.zip",

  // --- AI API KEYS ---
  mistralApiKey: "bT7gsfnbCth6Uhn36jGTepeYxKGwyKlX",
  mistralAgentId: "ag_019bd01a354e7052af8d175e7ae327a9",
  mistralOrgId: "4c084686-312f-4cb9-867c-23b589fe6185",
  mistralVoiceApiKey: "tdMqFoCsueYHaopgaTTke4iIvrS13cry",
  mistralVoiceAgentId: "ag_019bd1535f5e7478aa323dbc9ea5cb38",
  groqApiKey: "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",
  openaiApiKey: "",
  yarnApiKeys: [
    "sk_live_2IuLYDP72nKFwXP3uJDMxLCV81dDPBbyNe-hdISsr7E",
    "sk_live_m0UBBvMwF03_8pCGrYJqv2OJjUGfAabqVdtgSvgRQO8",
    "sk_live_QLIk6giCMLP8bKvJFpYq4GyI0zvcTN6GmMlBx55o6Cw",
    "sk_live_aOM4nSv6DDXrtBgP_JScoaL1beBW3XedOsIL7VmQTv4",
    "sk_live_RXvW25ePOldnHJKJ13QilUMCi_025NRtR1vXA_CPy-U",
  ],
};

/**
 * DEEP MERGE HELPER
 */
function merge(target, source) {
  if (!source) return target;
  for (const key of Object.keys(source)) {
    if (source[key] instanceof Object && key in target) {
      Object.assign(source[key], merge(target[key], source[key]));
    }
  }
  return { ...target, ...source };
}

/**
 * LOAD PERSISTENT SETTINGS
 * This ensures user-specific config is not lost during updates.
 */
let settings = defaults;
try {
  if (fs.existsSync(settingsPath)) {
    const userSettings = JSON.parse(fs.readFileSync(settingsPath, "utf8"));
    settings = merge(defaults, userSettings);
  } else {
    // If no persistent settings exist, create them from defaults
    // This happens on first run or after manual deletion
    if (!fs.existsSync(path.dirname(settingsPath))) {
      fs.mkdirSync(path.dirname(settingsPath), { recursive: true });
    }
    fs.writeFileSync(settingsPath, JSON.stringify(defaults, null, 2));
  }
} catch (e) {
  console.error(
    "[Settings] Critical: Failed to load persistent settings. Using defaults.",
    e,
  );
  settings = defaults;
}

module.exports = settings;
