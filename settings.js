const settings = {
  // --- IDENTITY ---
  botName: "Smile.(⁠◠⁠‿⁠◕⁠) Assistant",
  prefix: "!",
  botNumber: "2349114845487",
  ownerNumber: "2349114845487",
  ownerName: "Ogidan Oluwatimilehin Goodness ",

  // --- BRANDING ---
  packname: "𝕊𝔸𝕄𝕂𝕀𝔼𝕃 𝔹𝕆𝕋",
  developer: "ѕαмкιєℓ.∂єν",
  portfolio: "https://samkiel.dev",
  website: "https://samkielbot.app",
  version: "2.7.0",

  // --- FEATURE TOGGLES ---
  featureToggles: {
    AUTO_STATUS_VIEW: "on",     // ⚠️ STRING ONLY
    STATUS_VIEW_MSG: "off",       // ⚠️ STRING ONLY

    ENABLE_STATUS_REACTION: true, // Using autoReaction for status reaction too? Or false? "ENABLE_STATUS_REACTION: Boolean" from prompt. Let's map it to autoReaction or false if distinct. User requested AUTO_REACTION: Boolean to be present. I will assume ENABLE_STATUS_REACTION follows standard or autoReaction. Let's stick to safeBool(features.AUTO_REACTION) or false. The previous code mapped "ENABLE_STATUS_REACTION" to "false" (forced internal). I'll stick to forced false if distinct, OR map to autoReaction. Prompt says: "ENABLE_STATUS_REACTION: Boolean" and "AUTO_REACTION: Boolean". I'll default ENABLE_STATUS_REACTION to false for now unless specified. Actually, typically "Auto Reaction" implies status. I'll map it to AUTO_REACTION for consistency with previous implicit behavior, or false. Let's use false for ENABLE_STATUS_REACTION based on previous code having it false/internal.
    ANTI_DELETE: false,
    SEND_READ: false,
    ALWAYS_ONLINE: true,
    REJECT_CALL: true,
    PERSONAL_MESSAGE: false,
    DISABLE_START_MESSAGE: true,
    RANKING: false,
    AUTO_REACTION: true,

    STATUS_VIEW_EMOJI: "😑",
    ANTI_DELETE_TYPE: "group",
    COMMAND_MODE: "private",
    PACKNAME: "𝕊𝔸𝕄𝕂𝕀𝔼𝕃 𝔹𝕆𝕋"
  },

  giphyApiKey: "qnl7ssQChTdPjsKta2Ax2LMaGXz303tq",
  updateZipUrl: ""
};

module.exports = settings;