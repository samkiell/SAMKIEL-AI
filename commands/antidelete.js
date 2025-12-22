const fs = require("fs");
const path = require("path");
const { downloadContentFromMessage } = require("@whiskeysockets/baileys");
const { writeFile } = require("fs/promises");
const settings = require("../settings");

// In-memory message store for caching
const messageStore = new Map();
const TEMP_MEDIA_DIR = path.join(__dirname, "../tmp");

// Max cache size to prevent memory leaks (e.g., 5000 messages)
const MAX_CACHE_SIZE = 5000;

// Ensure tmp dir exists
if (!fs.existsSync(TEMP_MEDIA_DIR)) {
  fs.mkdirSync(TEMP_MEDIA_DIR, { recursive: true });
}

/**
 * Periodically clean up temp folder and old cache entries
 */
setInterval(() => {
  try {
    // 1. Clean up media files older than 1 hour
    const files = fs.readdirSync(TEMP_MEDIA_DIR);
    const now = Date.now();
    for (const file of files) {
      const filePath = path.join(TEMP_MEDIA_DIR, file);
      const stats = fs.statSync(filePath);
      if (now - stats.mtimeMs > 3600000) {
        // 1 hour
        fs.unlinkSync(filePath);
      }
    }

    // 2. Trim message cache
    if (messageStore.size > MAX_CACHE_SIZE) {
      const keys = Array.from(messageStore.keys());
      const toRemove = keys.slice(0, messageStore.size - MAX_CACHE_SIZE);
      toRemove.forEach((key) => messageStore.delete(key));
    }
  } catch (err) {
    console.error("Antidelete cleanup error:", err);
  }
}, 300000); // Every 5 minutes

/**
 * Stores incoming messages for later recovery
 */
async function storeMessage(message) {
  try {
    // We store unconditionally for now, filtering happens on deletion
    // but we check the global toggle to save resources
    if (!settings.featureToggles.ANTI_DELETE) return;

    if (!message?.key?.id || !message?.message) return;

    const messageId = message.key.id;
    const remoteJid = message.key.remoteJid;

    // Don't store status messages
    if (remoteJid === "status@broadcast") return;

    // Detect message type and content
    const mtype = Object.keys(message.message)[0];

    // We only care about user messages, not protocol/sender messages
    if (["protocolMessage", "senderKeyDistributionMessage"].includes(mtype))
      return;

    messageStore.set(messageId, {
      message: message.message,
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
    if (filterType === "group" && !isGroup) return;
    if (filterType === "private" && isGroup) return;

    // 3. Sender check: don't track our own deletions
    if (original.key.fromMe) return;

    // 4. Construct report and resend
    const sender = original.participant;
    const senderName = sender.split("@")[0];
    const deleter =
      revocationMessage.key.participant || revocationMessage.key.remoteJid;

    console.log(`♻️ Anti-delete triggered for ${targetId} in ${remoteJid}`);

    // Send original message back to the chat or owner
    // Standard behavior: send to the chat with a header
    const botName = settings.botName || "𝕊𝔸𝕄𝕂𝕀𝔼𝕃 𝔹𝕆𝕋";
    const header =
      `*🔰 ANTI-DELETE SYSTEM 🔰*\n\n` +
      `*👤 Deleted by:* @${deleter.split("@")[0]}\n` +
      `*🕒 Context:* ${isGroup ? "Group Chat" : "Private Chat"}\n` +
      `━━━━━━━━━━━━━━━━━━━`;

    // We use copyNForward or just sendMessage with the cached message content
    // resending the original content is cleaner

    await sock.sendMessage(remoteJid, {
      text: header,
      mentions: [deleter, sender],
    });

    // Forward the original message
    // We use a clean way to resend
    await sock.copyNForward(remoteJid, original, true);

    // Remove from cache after recovery to prevent double triggers
    messageStore.delete(targetId);
  } catch (err) {
    console.error("Error in handleMessageRevocation:", err);
  }
}

/**
 * Manual command to toggle state (optional, but keep for compatibility)
 */
async function handleAntideleteCommand(sock, chatId, message, args) {
  const { isOwner } = require("../lib/isOwner");
  const senderId = message.key.participant || message.key.remoteJid;

  if (!(await isOwner(senderId))) {
    return sock.sendMessage(chatId, { text: "❌ Owner only command." });
  }

  const mode = args[0]?.toLowerCase();
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
