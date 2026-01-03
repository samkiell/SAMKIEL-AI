const botName = "𝕊𝔸𝕄𝕂𝕀𝔼𝕃 𝔹𝕆𝕋";

const settings = {
  // Core Foundationn
  botName: botName,
  prefix: ".",
  botNumber: "",
  ownerNumber: "2348087357158",
  ownerName: "SAMKIEL",
  developer: "ѕαмкιєℓ.∂єν",
  portfolio: "https://samkiel.dev",
  website: "https://samkielbot.app",

  // Feature Toggles
  featureToggles: {
    AUTO_STATUS_VIEW: "on", // Options: "off", "on" (view only), "no-dl" (view only) - Auto-download disabled to save space
    ENABLE_STATUS_REACTION: true, // Toggle for status reactions
    STATUS_VIEW_EMOJI: "👀",
    STATUS_VIEW_MSG: "off",
    ANTI_DELETE: true,
    SEND_READ: false,
    ALWAYS_ONLINE: true,
    REJECT_CALL: true,
    PERSONAL_MESSAGE: false,
    DISABLE_START_MESSAGE: false,
    ANTI_DELETE_TYPE: "all", // Options: "all", "group", or "private"
    COMMAND_MODE: "public",
    RANKING: false,
    AUTO_REACTION: false,
    PACKNAME: "𝕊𝔸𝕄𝕂𝕀𝔼𝕃 𝔹𝕆𝕋",
  },

  // Metadata & Other Configs
  author: "𝕊𝔸𝕄𝕂𝕀𝔼𝕃 𝔹𝕆𝕋",
  giphyApiKey: "qnl7ssQChTdPjsKta2Ax2LMaGXz303tq",
  description:
    "This is a bot for managing group commands and automating tasks.",
  version: "2.7.0",
  updateZipUrl: "https://github.com/samkiell//archive/refs/heads/main.zip",
};

module.exports = settings;
