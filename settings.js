const settings = {
  // Core Foundation
  botName: "My Awesome Bot",
  prefix: ".",
  botNumber: "2348012345678",
  ownerNumber: "2348012345678",
  ownerName: "Admin 𝕊𝔸𝕄𝕂𝕀𝔼𝕃 𝔹𝕆𝕋",
  developer: "ѕαмкιєℓ.∂єν",
  portfolio: "https://samkiel.dev",
  website: "https://samkielbot.app",

  // Feature Toggles (Configured by Platform)
  featureToggles: {
    // Privacy & Security
    COMMAND_MODE: "public", // "public" or "private"
    REJECT_CALL: false, // true/false
    ANTI_DELETE: false, // true/false
    ANTI_DELETE_TYPE: "all", // "all" or "dm"

    // Activity & Automation
    ALWAYS_ONLINE: true, // true/false
    SEND_READ: false, // true/false (Blue Ticks)
    AUTO_STATUS_VIEW: "on", // "on" or "off"
    STATUS_VIEW_EMOJI: "👀", // Emoji for status
    STATUS_VIEW_MSG: "off", // "off" or text
    PERSONAL_MESSAGE: false, // true/false (Enable in DM)
    DISABLE_START_MESSAGE: false, // true/false (Start message)
    RANKING: false, // true/false
    AUTO_REACTION: false, // true/false
    PACKNAME: "𝕊𝔸𝕄𝕂𝕀𝔼𝕃 𝔹𝕆𝕋",
    ENABLE_STATUS_REACTION: false, // Internal flag
  },

  // Metadata & Other Configs
  author: "𝕊𝔸𝕄𝕂𝕀𝔼𝕃 𝔹𝕆𝕋",
  giphyApiKey: "qnl7ssQChTdPjsKta2Ax2LMaGXz303tq",
  description:
    "This is a bot for managing group commands and automating tasks.",
  version: "2.7.0",
  updateZipUrl:
    "https://github.com/samkiell/SAMKIEL-AI/archive/refs/heads/main.zip",
};

module.exports = settings;
