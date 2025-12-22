const fs = require("fs");
const path = require("path");
const {
  downloadContentFromMessage,
  generateForwardMessageContent,
  generateWAMessageFromContent,
  getContentType,
} = require("@whiskeysockets/baileys");
const { writeFile } = require("fs/promises");
const settings = require("../settings");

// In-memory message store for caching
const messageStore = new Map();
const MAX_CACHE_SIZE = 5000;

/**
 * Periodically clean up old cache entries
 */
setInterval(() => {
  if (messageStore.size > MAX_CACHE_SIZE) {
    const keys = Array.from(messageStore.keys());
    const toRemove = keys.slice(0, messageStore.size - MAX_CACHE_SIZE);
    toRemove.forEach((key) => messageStore.delete(key));
  }
}, 300000); // Every 5 minutes

/**
 * Helper to copy and forward a message
 */
async function copyNForward(
  sock,
  jid,
  message,
  forceForward = false,
  options = {}
) {
  try {
    const content = await generateForwardMessageContent(message, forceForward);
    const contentType = getContentType(content);

    let context = {};
    const originalMType = getContentType(message.message);
    if (originalMType !== "conversation") {
      context = message.message[originalMType]?.contextInfo || {};
    }

    content[contentType].contextInfo = {
      ...context,
      ...content[contentType].contextInfo,
      ...options.contextInfo,
    };

    const waMessage = await generateWAMessageFromContent(jid, content, {
      ...options,
      userJid: sock.user.id,
    });

    await sock.relayMessage(jid, waMessage.message, {
      messageId: waMessage.key.id,
    });
    return waMessage;
  } catch (e) {
    console.error("Error in copyNForward:", e);
    // Fallback: just send text if possible
    const text =
      message.message?.conversation ||
      message.message?.extendedTextMessage?.text;
    if (text) {
      await sock.sendMessage(jid, { text: `[Fallback] ${text}` });
    }
  }
}

/**
 * Stores incoming messages for later recovery
 */
async function storeMessage(message) {
  try {
    // Only store if anti-delete is enabled globally
    if (!settings.featureToggles.ANTI_DELETE) return;

    if (!message?.key?.id || !message?.message) return;

    const messageId = message.key.id;
    const remoteJid = message.key.remoteJid;

    // Don't store status messages
    if (remoteJid === "status@broadcast") return;

    // Detect message type
    const mtype = getContentType(message.message);

    // Skip protocol/control messages
    if (
      [
        "protocolMessage",
        "senderKeyDistributionMessage",
        "reactionMessage",
      ].includes(mtype)
    )
      return;

    // Cache the message
    // We deep copy to avoid issues if the original object is modified
    messageStore.set(messageId, {
      message: JSON.parse(JSON.stringify(message.message)),
      key: message.key,
      remoteJid: remoteJid,
      participant: message.key.participant || remoteJid,
      timestamp: Date.now(),
    });
  } catch (err) {
    console.error("Error in storeMessage:", err);
  }
}

/**
 * Handles message deletion events
 */
async function handleMessageRevocation(sock, revocationMessage) {
  try {
    // 1. Core toggle check
    if (!settings.featureToggles.ANTI_DELETE) return;

    const protocolMsg = revocationMessage.message?.protocolMessage;
    if (protocolMsg?.type !== 0) return; // 0 is REVOKE

    const targetId = protocolMsg.key.id;
    const original = messageStore.get(targetId);

    if (!original) return;

    const remoteJid = original.remoteJid;
    const isGroup = remoteJid.endsWith("@g.us");

    // 2. Type filter check
    const filterType = (
      settings.featureToggles.ANTI_DELETE_TYPE || "all"
    ).toLowerCase();

    // Normalize user input (handle "group only" etc)
    if (filterType.includes("group") && !isGroup) return;
    if (filterType.includes("private") && isGroup) return;

    // 3. Sender check: don't track our own deletions
    if (original.key.fromMe) return;

    const sender = original.participant;
    const deleter =
      revocationMessage.key.participant || revocationMessage.key.remoteJid;

    console.log(`♻️ Anti-delete triggered for ${targetId} in ${remoteJid}`);

    // 4. Construct report header
    const botName = settings.botName || "𝕊𝔸𝕄𝕂𝕀𝔼𝕃 𝔹𝕆𝕋";
    const header =
      `*🔰 ANTI-DELETE SYSTEM 🔰*\n\n` +
      `*👤 Deleted by:* @${deleter.split("@")[0]}\n` +
      `*🕒 Context:* ${isGroup ? "Group Chat" : "Private Chat"}\n` +
      `━━━━━━━━━━━━━━━━━━━`;

    // 5. Send header
    await sock.sendMessage(remoteJid, {
      text: header,
      mentions: [deleter, sender],
    });

    // 6. Resend the original message
    await copyNForward(sock, remoteJid, original, true);

    // 7. Remove from cache to prevent double recovery
    messageStore.delete(targetId);
  } catch (err) {
    console.error("Error in handleMessageRevocation:", err);
  }
}

/**
 * Command to toggle state
 */
async function handleAntideleteCommand(sock, chatId, message, args) {
  const { isOwner } = require("../lib/isOwner");
  const senderId = message.key.participant || message.key.remoteJid;

  if (!(await isOwner(senderId))) {
    return sock.sendMessage(chatId, { text: "❌ Owner only command." });
  }

  const mode = args?.toLowerCase() || "";
  if (mode === "on") {
    settings.featureToggles.ANTI_DELETE = true;
    await sock.sendMessage(chatId, { text: "✅ Anti-delete system enabled." });
  } else if (mode === "off") {
    settings.featureToggles.ANTI_DELETE = false;
    await sock.sendMessage(chatId, { text: "❌ Anti-delete system disabled." });
  } else {
    const status = settings.featureToggles.ANTI_DELETE ? "ON" : "OFF";
    const type = settings.featureToggles.ANTI_DELETE_TYPE;
    await sock.sendMessage(chatId, {
      text: `*ANTIDELETE SETTINGS*\n\nStatus: ${status}\nType: ${type}\n\nUse: .antidelete on/off`,
    });
  }
}

module.exports = {
  storeMessage,
  handleMessageRevocation,
  handleAntideleteCommand,
};
