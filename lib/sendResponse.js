/**
 * Centralized Response Helper
 * Controls branding (channel footer) for command outputs.
 *
 * RULES:
 * - withBranding: false (default) = No channel/newsletter branding
 * - withBranding: true = Include global.channelInfo branding
 *
 * Only specific commands should use branding:
 * - menu, help, start, about, community, invite, deploy, channel
 *
 * Utility commands like ping, tagall, listonline, admin utilities, settings
 * should NEVER include branding.
 */

/**
 * Send a text message with optional branding
 * @param {object} sock - Baileys socket
 * @param {string} chatId - Chat JID
 * @param {string} text - Message text
 * @param {object} options - Options object
 * @param {boolean} options.withBranding - Include channel branding (default: false)
 * @param {object} options.quoted - Message to quote
 * @param {Array} options.mentions - JIDs to mention
 * @returns {Promise<object>} - Message result
 */
async function sendText(sock, chatId, text, options = {}) {
  const { withBranding = false, quoted = null, mentions = [] } = options;

  const messagePayload = { text };

  if (mentions && mentions.length > 0) {
    messagePayload.mentions = mentions;
  }

  // Only add branding if explicitly requested
  if (withBranding && global.channelInfo) {
    Object.assign(messagePayload, global.channelInfo);
  }

  const sendOptions = {};
  if (quoted) {
    sendOptions.quoted = quoted;
  }

  return await sock.sendMessage(chatId, messagePayload, sendOptions);
}

/**
 * Send an image message with optional branding
 * @param {object} sock - Baileys socket
 * @param {string} chatId - Chat JID
 * @param {Buffer|object} image - Image buffer or URL object
 * @param {string} caption - Image caption
 * @param {object} options - Options object
 * @returns {Promise<object>} - Message result
 */
async function sendImage(sock, chatId, image, caption = "", options = {}) {
  const { withBranding = false, quoted = null, mentions = [] } = options;

  const messagePayload = { image, caption };

  if (mentions && mentions.length > 0) {
    messagePayload.mentions = mentions;
  }

  if (withBranding && global.channelInfo) {
    Object.assign(messagePayload, global.channelInfo);
  }

  const sendOptions = {};
  if (quoted) {
    sendOptions.quoted = quoted;
  }

  return await sock.sendMessage(chatId, messagePayload, sendOptions);
}

/**
 * Send a message with edit capability (for ping-style commands)
 * @param {object} sock - Baileys socket
 * @param {string} chatId - Chat JID
 * @param {string} text - Message text
 * @param {object} options - Options object
 * @returns {Promise<object>} - Message result with key for editing
 */
async function sendEditable(sock, chatId, text, options = {}) {
  const { withBranding = false, quoted = null } = options;

  const messagePayload = { text };

  if (withBranding && global.channelInfo) {
    Object.assign(messagePayload, global.channelInfo);
  }

  const sendOptions = {};
  if (quoted) {
    sendOptions.quoted = quoted;
  }

  return await sock.sendMessage(chatId, messagePayload, sendOptions);
}

/**
 * Edit an existing message
 * @param {object} sock - Baileys socket
 * @param {string} chatId - Chat JID
 * @param {object} key - Message key to edit
 * @param {string} text - New message text
 * @param {object} options - Options object
 * @returns {Promise<object>} - Message result
 */
async function editMessage(sock, chatId, key, text, options = {}) {
  const { withBranding = false } = options;

  const messagePayload = { text, edit: key };

  if (withBranding && global.channelInfo) {
    Object.assign(messagePayload, global.channelInfo);
  }

  return await sock.sendMessage(chatId, messagePayload);
}

/**
 * Commands that should include branding
 */
const BRANDED_COMMANDS = [
  "menu",
  "help",
  "bot",
  "list",
  "start",
  "about",
  "community",
  "invite",
  "deploy",
  "channel",
  "owner",
  "alive",
];

/**
 * Check if a command should have branding
 * @param {string} command - Command name
 * @returns {boolean}
 */
function shouldHaveBranding(command) {
  if (!command) return false;
  const cmd = command.toLowerCase().split(" ")[0];
  return BRANDED_COMMANDS.includes(cmd);
}

module.exports = {
  sendText,
  sendImage,
  sendEditable,
  editMessage,
  shouldHaveBranding,
  BRANDED_COMMANDS,
};
