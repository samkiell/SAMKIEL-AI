const settings = {
  // --- IDENTITY ---
  botName: "Travis",
  prefix: ".",
  botNumber: "919446640118",
  ownerNumber: "917558874118",
  ownerName: "ft.sinaan",

  // --- BRANDING & CREDITS ---
  author: "𝕊𝔸𝕄𝕂𝕀𝔼𝕃 𝔹𝕆𝕋",
  packname: "@ft.sinaan",
  developer: "ѕαмкιєℓ.∂єν",
  portfolio: "https://samkiel.dev",
  website: "https://samkielbot.app",
  description: "Whatsapp Bot",
  version: "2.7.0",

  // --- FEATURE TOGGLES ---
  featureToggles: {
    AUTO_STATUS_VIEW: "on",     // ⚠️ STRING ONLY
    STATUS_VIEW_MSG: "off",       // ⚠️ STRING ONLY

    ENABLE_STATUS_REACTION: true,
    ANTI_DELETE: true,
    SEND_READ: false,
    ALWAYS_ONLINE: true,
    REJECT_CALL: true,
    PERSONAL_MESSAGE: false,
    DISABLE_START_MESSAGE: false,
    RANKING: false,
    AUTO_REACTION: true,

    // --- NEW FEATURES ---
    ANTI_LINK: false,
    ANTI_BADWORD: false,
    AUTO_READ: false,
    CHATBOT: false,
    AUTO_BIO: false,
    AUTO_TYPING: false,
    AUTO_RECORDING: false,
    FAILSAFE: false,
    LOCKDOWN: false,
    // --- END NEW FEATURES ---

    STATUS_VIEW_EMOJI: "👀",
    ANTI_DELETE_TYPE: "dm",
    COMMAND_MODE: "public",
    VOICE_CHAT: false,
    PACKNAME: "@ft.sinaan",
    AUTO_RESTART: true
  },

  // --- INTERNAL ---
  giphyApiKey: "qnl7ssQChTdPjsKta2Ax2LMaGXz303tq",
  updateZipUrl: "https://github.com/samkiell/SAMKIEL-AI/archive/refs/heads/main.zip",

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

module.exports = settings;