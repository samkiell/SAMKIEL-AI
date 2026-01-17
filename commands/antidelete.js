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
const { isOwner } = require("../lib/isOwner");

// In-memory message store for caching
const messageStore = new Map();
const MAX_CACHE_SIZE = 5000;
const configPath = path.join(__dirname, "../data/antiDelete.json");

// Ensure config exists
if (!fs.existsSync(configPath)) {
  fs.writeFileSync(
    configPath,
    JSON.stringify(
      {
        enabled: settings.featureToggles.ANTI_DELETE ?? false,
        mode: settings.featureToggles.ANTI_DELETE_TYPE || "group",
        allowedGroups: [],
      },
      null,
      2,
    ),
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
  options = {},
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
    let config = { enabled: settings.featureToggles.ANTI_DELETE ?? false };
    try {
      if (fs.existsSync(configPath)) {
        config = JSON.parse(fs.readFileSync(configPath));
      }
    } catch (e) {}

    // Only store if anti-delete is enabled globally
    if (!config.enabled) return;

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

    // Global toggle check
    if (!config.enabled) return;

    const protocolMsg = revocationMessage.message?.protocolMessage;
    if (protocolMsg?.type !== 0) return; // 0 is REVOKE

    const targetId = protocolMsg.key.id;
    const original = messageStore.get(targetId);

    if (!original) return;

    // 2. Sender check (Never forward bot's own messages)
    if (original.key.fromMe) return;

    const remoteJid = original.remoteJid;
    const isGroup = remoteJid.endsWith("@g.us");

    // 3. Group Eligibility Check
    if (isGroup) {
      // If allowedGroups has entries, we restrict to those.
      // If it's empty, we allow ALL groups as long as global toggle is ON.
      if (config.allowedGroups && config.allowedGroups.length > 0) {
        if (!config.allowedGroups.includes(remoteJid)) {
          return;
        }
      }
    }

    const deleter =
      revocationMessage.key.participant || revocationMessage.key.remoteJid;
    const sender = original.participant;
    const botNumberJid = sock.user.id.split(":")[0] + "@s.whatsapp.net";
    const ownerNumberJid = settings.ownerNumber + "@s.whatsapp.net";

    let destinations = [];
    const contextHeader = isGroup ? "Group Chat" : "Private Chat";

    // 4. Mode-Based Routing Logic
    if (config.mode === "dm") {
      // Mode: "dm"
      // Send to Bot (Self) as Primary Log
      destinations.push(botNumberJid);

      // Fallback/Secondary: Send to Owner DM (if different from bot)
      if (ownerNumberJid !== botNumberJid) {
        destinations.push(ownerNumberJid);
      }

      // Notes:
      // - If deleted in Group: Do NOT send to group, do NOT send to user.
      // - If deleted in Private: Sent to Bot/Owner DM only.
    } else if (config.mode === "group") {
      // Mode: "group"
      if (isGroup) {
        // Send to Group
        destinations.push(remoteJid);
        // Send to Deleter's DM
        if (deleter) destinations.push(deleter);
      } else {
        // If deleted in private chat in "group" mode -> Do nothing
        return;
      }
    }

    // Deduplicate destinations
    destinations = [...new Set(destinations)];

    if (destinations.length === 0) return;

    console.log(
      `♻️ Anti-delete triggered for ${targetId} in ${remoteJid}. Mode: ${config.mode}`,
    );

    // 5. Construct Report Header
    // 5. Construct Report Header
    let groupName = "";
    if (isGroup) {
      if (destinations.includes(remoteJid)) {
        // If sending strictly to the group itself, we don't need to fetch metadata (saves API call)
        // But if sending to DM, we want the name.
        // Let's just fetch it if we can.
      }
      try {
        const metadata = await sock.groupMetadata(remoteJid);
        groupName = metadata.subject;
      } catch {
        groupName = "Unknown Group";
      }
    }

    const header =
      `*🔰 ANTI-DELETE SYSTEM 🔰*\n\n` +
      `*👤 Deleted by:* @${deleter.split("@")[0]}\n` +
      `*👤 Sent by:* @${sender.split("@")[0]}\n` +
      `*🕒 Context:* ${contextHeader}\n` +
      (isGroup ? `*📍 Group:* ${groupName}\n` : "") +
      `━━━━━━━━━━━━━━━━━━━`;

    // 6. Send to all destinations
    for (const dest of destinations) {
      await sock.sendMessage(dest, {
        text: header,
        mentions: [deleter, sender],
        // global.channelInfo removed to ensure delivery to DM/Self
      });

      await copyNForward(sock, dest, original, true);
    }

    // 7. Cleanup
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
    return sock.sendMessage(chatId, {
      text: "❌ Owner only command.",
      ...global.channelInfo,
    });
  }

  // Load config
  let config = { enabled: false, mode: "group", allowedGroups: [] };
  if (fs.existsSync(configPath)) {
    config = JSON.parse(fs.readFileSync(configPath));
  }

  // Parse args
  let subCmd = "";
  let param = "";

  if (typeof args === "string") {
    const parts = args.trim().split(/\s+/);
    subCmd = parts[0] ? parts[0].toLowerCase() : "";
    param = parts[1] ? parts[1].toLowerCase() : "";
  } else if (Array.isArray(args)) {
    subCmd = args[0] ? args[0].toLowerCase() : "";
    param = args[1] ? args[1].toLowerCase() : "";
  }

  if (subCmd === "on") {
    config.enabled = true;
    fs.writeFileSync(configPath, JSON.stringify(config));
    await sock.sendMessage(chatId, {
      text: "✅ Anti-delete system enabled globally.",
      ...global.channelInfo,
    });
  } else if (subCmd === "off") {
    config.enabled = false;
    fs.writeFileSync(configPath, JSON.stringify(config));
    await sock.sendMessage(chatId, {
      text: "❌ Anti-delete system disabled globally.",
      ...global.channelInfo,
    });
  } else if (subCmd === "type") {
    if (param === "group") {
      config.mode = "group";
      fs.writeFileSync(configPath, JSON.stringify(config));
      await sock.sendMessage(chatId, {
        text: "✅ Mode set to GROUP: Deleted messages will be sent to the group chat.",
        ...global.channelInfo,
      });
    } else if (param === "dm") {
      config.mode = "dm";
      fs.writeFileSync(configPath, JSON.stringify(config));
      await sock.sendMessage(chatId, {
        text: "✅ Mode set to DM: Deleted messages will be forwarded to your DM.",
        ...global.channelInfo,
      });
    } else {
      await sock.sendMessage(chatId, {
        text: "❌ Invalid type! Use 'group' or 'dm'.",
        ...global.channelInfo,
      });
    }
  } else if (subCmd === "gc") {
    if (!message.key.remoteJid.endsWith("@g.us")) {
      await sock.sendMessage(chatId, {
        text: "❌ This command is for groups only.",
        ...global.channelInfo,
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
        ...global.channelInfo,
      });
    } else if (param === "off") {
      config.allowedGroups = config.allowedGroups.filter((id) => id !== chatId);
      fs.writeFileSync(configPath, JSON.stringify(config));
      await sock.sendMessage(chatId, {
        text: "❌ Anti-delete disabled for this group.",
        ...global.channelInfo,
      });
    } else {
      await sock.sendMessage(chatId, {
        text: "❌ Use 'gc on' or 'gc off'.",
        ...global.channelInfo,
      });
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
      ...global.channelInfo,
    });
  }
}

module.exports = {
  storeMessage,
  handleMessageRevocation,
  handleAntideleteCommand,
};
