const settings = {
  // --- IDENTITY ---
  botName: "Gravity ",
  prefix: ".",
  botNumber: "2347076351531",
  ownerNumber: "2347076351531",
  ownerName: "Moyinoluwa Prosper",

  // --- BRANDING ---
  packname: "Prosper ",
  developer: "ѕαмкιєℓ.∂єν",
  portfolio: "https://samkiel.dev",
  website: "https://samkielbot.app",
  version: "2.7.0",

  // --- FEATURE TOGGLES ---
  featureToggles: {
    AUTO_STATUS_VIEW: "off",     // ⚠️ STRING ONLY
    STATUS_VIEW_MSG: "off",       // ⚠️ STRING ONLY

    ENABLE_STATUS_REACTION: false,
    ANTI_DELETE: true,
    SEND_READ: false,
    ALWAYS_ONLINE: true,
    REJECT_CALL: false,
    PERSONAL_MESSAGE: false,
    DISABLE_START_MESSAGE: false,
    RANKING: false,
    AUTO_REACTION: false,

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
    COMMAND_MODE: "private",
    VOICE_CHAT: true,
    PACKNAME: "Prosper "
  },

  giphyApiKey: "qnl7ssQChTdPjsKta2Ax2LMaGXz303tq",
  updateZipUrl: ""
};

module.exports = settings;