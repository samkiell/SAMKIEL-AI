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
const { loadPrefix } = require("../lib/prefix");

// In-memory message store for caching
const messageStore = new Map();
const MAX_CACHE_SIZE = 5000;
const configPath = path.join(__dirname, "../data/antiDelete.json");

// Ensure config exists
if (!fs.existsSync(configPath)) {
  fs.writeFileSync(
    configPath,
    JSON.stringify({ enabled: false, mode: "group", allowedGroups: [] })
  );
}

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
    // Check local config first
    let config = { enabled: false };
    try {
      if (fs.existsSync(configPath)) {
        config = JSON.parse(fs.readFileSync(configPath));
      }
    } catch (e) {}

    // Only store if anti-delete is enabled globally
    if (!config.enabled && !settings.featureToggles.ANTI_DELETE) return;

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
    // 1. Load config
    let config = { enabled: false, mode: "group", allowedGroups: [] };
    if (fs.existsSync(configPath)) {
      config = JSON.parse(fs.readFileSync(configPath));
    }

    if (!config.enabled) return;

    const protocolMsg = revocationMessage.message?.protocolMessage;
    if (protocolMsg?.type !== 0) return; // 0 is REVOKE

    const targetId = protocolMsg.key.id;
    const original = messageStore.get(targetId);

    if (!original) return;

    const remoteJid = original.remoteJid;
    const isGroup = remoteJid.endsWith("@g.us");

    // 2. Group Whitelist Check
    if (isGroup) {
      if (!config.allowedGroups.includes(remoteJid)) return;
    } else {
      // For private chats, maybe strict enable? Or just allow all?
      // User focused on groups. Let's allow private by default if enabled globally?
      // Or maybe strictly follow "specific to a certain group".
      // Let's assume private chats are always allowed if globally enabled,
      // UNLESS user logic was purely group focused.
      // Usually "anti-delete" on private chat is default behavior for many bots.
      // Let's keep private chat working if enabled globally.
    }

    // 3. Sender check
    if (original.key.fromMe) return;

    const deleter =
      revocationMessage.key.participant || revocationMessage.key.remoteJid;
    const sender = original.participant;

    console.log(`♻️ Anti-delete triggered for ${targetId} in ${remoteJid}`);

    // 4. Determine destination
    let destJid = remoteJid;
    let contextHeader = isGroup ? "Group Chat" : "Private Chat";

    // Mode: "dm" -> send to owner
    if (config.mode === "dm") {
      destJid = settings.ownerNumber + "@s.whatsapp.net";
      contextHeader += ` (Forwarded from ${remoteJid})`;
    }

    // 5. Construct Report
    const header =
      `*🔰 ANTI-DELETE SYSTEM 🔰*\n\n` +
      `*👤 Deleted by:* @${deleter.split("@")[0]}\n` +
      `*👤 Sent by:* @${sender.split("@")[0]}\n` +
      `*🕒 Context:* ${contextHeader}\n` +
      `━━━━━━━━━━━━━━━━━━━`;

    // 6. Send Header
    await sock.sendMessage(destJid, {
      text: header,
      mentions: [deleter, sender],
    });

    // 7. Resend Content
    await copyNForward(sock, destJid, original, true);

    // 8. Cleanup
    messageStore.delete(targetId);
  } catch (err) {
    console.error("Error in handleMessageRevocation:", err);
  }
}

/**
 * Command to toggle state
 */
async function handleAntideleteCommand(sock, chatId, message, args) {
  const senderId = message.key.participant || message.key.remoteJid;

  if (!(await isOwner(senderId))) {
    return sock.sendMessage(chatId, { text: "❌ Owner only command." });
  }

  // Load config
  let config = { enabled: false, mode: "group", allowedGroups: [] };
  if (fs.existsSync(configPath)) {
    config = JSON.parse(fs.readFileSync(configPath));
  }

  // Parse args
  const subCmd = args[0] ? args[0].toLowerCase() : "";
  const param = args[1] ? args[1].toLowerCase() : "";

  if (subCmd === "on") {
    config.enabled = true;
    fs.writeFileSync(configPath, JSON.stringify(config));
    await sock.sendMessage(chatId, {
      text: "✅ Anti-delete system enabled globally.",
    });
  } else if (subCmd === "off") {
    config.enabled = false;
    fs.writeFileSync(configPath, JSON.stringify(config));
    await sock.sendMessage(chatId, {
      text: "❌ Anti-delete system disabled globally.",
    });
  } else if (subCmd === "type") {
    if (param === "group") {
      config.mode = "group";
      fs.writeFileSync(configPath, JSON.stringify(config));
      await sock.sendMessage(chatId, {
        text: "✅ Mode set to GROUP: Deleted messages will be sent to the group chat.",
      });
    } else if (param === "dm") {
      config.mode = "dm";
      fs.writeFileSync(configPath, JSON.stringify(config));
      await sock.sendMessage(chatId, {
        text: "✅ Mode set to DM: Deleted messages will be forwarded to your DM.",
      });
    } else {
      await sock.sendMessage(chatId, {
        text: "❌ Invalid type! Use 'group' or 'dm'.",
      });
    }
  } else if (subCmd === "gc") {
    if (!message.key.remoteJid.endsWith("@g.us")) {
      await sock.sendMessage(chatId, {
        text: "❌ This command is for groups only.",
      });
      return;
    }

    if (param === "on") {
      if (!config.allowedGroups.includes(chatId)) {
        config.allowedGroups.push(chatId);
        fs.writeFileSync(configPath, JSON.stringify(config));
      }
      await sock.sendMessage(chatId, {
        text: "✅ Anti-delete active for this group.",
      });
    } else if (param === "off") {
      config.allowedGroups = config.allowedGroups.filter((id) => id !== chatId);
      fs.writeFileSync(configPath, JSON.stringify(config));
      await sock.sendMessage(chatId, {
        text: "❌ Anti-delete disabled for this group.",
      });
    } else {
      await sock.sendMessage(chatId, { text: "❌ Use 'gc on' or 'gc off'." });
    }
  } else {
    // Status Display
    const status = config.enabled ? "ON" : "OFF";
    const mode = config.mode.toUpperCase();
    const isAllowed = config.allowedGroups.includes(chatId) ? "YES" : "NO";
    const currentPrefix = loadPrefix();
    const p = currentPrefix === "off" ? "" : currentPrefix;

    await sock.sendMessage(chatId, {
      text: `🔰 *Antidelete Configuration*
      
📊 *Global Status:* ${status}
🔄 *Mode:* ${mode}
🏘️ *Active in this Group:* ${isAllowed}

*Commands:*
${p}antidelete on/off (Global Switch)
${p}antidelete type group (Send to Group)
${p}antidelete type dm (Send to Owner DM)
${p}antidelete gc on/off (Enable/Disable for current group)`,
    });
  }
}

module.exports = {
  storeMessage,
  handleMessageRevocation,
  handleAntideleteCommand,
};
