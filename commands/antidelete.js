const fs = require("fs");
const path = require("path");
const {
  downloadContentFromMessage,
  generateForwardMessageContent,
  generateWAMessageFromContent,
  getContentType,
} = require("@whiskeysockets/baileys");
const settings = require("../settings");
const { loadPrefix } = require("../lib/prefix");
const { isOwner } = require("../lib/isOwner");

// Cache mechanism
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
        allowedGroups: [],
      },
      null,
      2,
    ),
  );
}

// Cleanup Cache every 5 mins
setInterval(() => {
  if (messageStore.size > MAX_CACHE_SIZE) {
    const keys = Array.from(messageStore.keys());
    const toRemove = keys.slice(0, messageStore.size - MAX_CACHE_SIZE);
    toRemove.forEach((key) => messageStore.delete(key));
  }
}, 300000);

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

    if (originalMType !== "conversation" && message.message[originalMType]) {
      context = message.message[originalMType].contextInfo || {};
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
    // Fallback text
    const text =
      message.message?.conversation ||
      message.message?.extendedTextMessage?.text;
    if (text)
      await sock.sendMessage(jid, { text: `[Fallback Content] ${text}` });
  }
}

/**
 * Store incoming message
 */
async function storeMessage(message) {
  try {
    if (!message?.key?.id || !message?.message) return;

    // Check global toggle
    let config = { enabled: false };
    try {
      if (fs.existsSync(configPath))
        config = JSON.parse(fs.readFileSync(configPath));
    } catch {}
    if (!config.enabled) return;

    const remoteJid = message.key.remoteJid;
    if (remoteJid === "status@broadcast") return;

    const mtype = getContentType(message.message);
    if (
      [
        "protocolMessage",
        "senderKeyDistributionMessage",
        "reactionMessage",
      ].includes(mtype)
    )
      return;

    messageStore.set(message.key.id, {
      message: JSON.parse(JSON.stringify(message.message)),
      key: message.key,
      remoteJid: remoteJid,
      participant: message.key.participant || remoteJid,
      timestamp: Date.now(),
    });
  } catch (err) {
    console.error("Antidelete Store Error:", err);
  }
}

/**
 * Handle Revoke Event
 */
async function handleMessageRevocation(sock, revocationMessage) {
  try {
    const protocolMsg = revocationMessage.message?.protocolMessage;
    if (protocolMsg?.type !== 0) return; // Only REVOKE

    const targetId = protocolMsg.key.id;
    const original = messageStore.get(targetId);
    if (!original) return;

    // Ignore bot's own deleted messages
    if (original.key.fromMe) return;

    // Load Config
    let config = { enabled: false };
    try {
      if (fs.existsSync(configPath))
        config = JSON.parse(fs.readFileSync(configPath));
    } catch {}
    if (!config.enabled) return;

    const remoteJid = original.remoteJid;
    const isGroup = remoteJid.endsWith("@g.us");
    const deleter =
      revocationMessage.key.participant || revocationMessage.key.remoteJid;
    const sender = original.participant;

    // Routing: STRICTLY DM (Owner + Bot)
    const botNumberJid = sock.user.id.split(":")[0] + "@s.whatsapp.net";
    const ownerNumberJid = settings.ownerNumber + "@s.whatsapp.net";

    let destinations = [];
    if (ownerNumberJid) destinations.push(ownerNumberJid);
    if (botNumberJid !== ownerNumberJid) destinations.push(botNumberJid);

    destinations = [...new Set(destinations)];
    if (destinations.length === 0) return;

    // Log
    console.log(
      `♻️ Antidelete triggered. Forwarding to ${destinations.length} DM(s).`,
    );

    // Get Group Name
    let groupName = "Private Chat";
    if (isGroup) {
      try {
        const metadata = await sock.groupMetadata(remoteJid);
        groupName = metadata.subject;
      } catch {
        groupName = "Unknown Group";
      }
    }

    const header =
      `*🔰 ANTI-DELETE DETECTED 🔰*\n\n` +
      `*👤 Deleted by:* @${deleter.split("@")[0]}\n` +
      `*👤 Sent by:* @${sender.split("@")[0]}\n` +
      `*📍 Context:* ${isGroup ? `Group (${groupName})` : "Private Chat"}\n` +
      `━━━━━━━━━━━━━━━━━━━`;

    // Send
    for (const dest of destinations) {
      await sock.sendMessage(dest, {
        text: header,
        mentions: [deleter, sender],
      });
      await copyNForward(sock, dest, original, true);
    }

    messageStore.delete(targetId);
  } catch (err) {
    console.error("Antidelete Handle Error:", err);
  }
}

/**
 * Command Handler
 */
async function handleAntideleteCommand(sock, chatId, message, args) {
  const senderId = message.key.participant || message.key.remoteJid;
  if (!(await isOwner(senderId)))
    return sock.sendMessage(chatId, { text: "❌ Owner only command." });

  let config = { enabled: false };
  if (fs.existsSync(configPath)) {
    try {
      config = JSON.parse(fs.readFileSync(configPath));
    } catch {}
  }

  const subCmd = (
    Array.isArray(args) ? args[0] : args.toString().split(" ")[0]
  )?.toLowerCase();

  if (subCmd === "on") {
    config.enabled = true;
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    await sock.sendMessage(chatId, {
      text: "✅ Anti-delete ENABLED.\nDeleted messages will be sent to Owner/Bot DMs.",
    });
  } else if (subCmd === "off") {
    config.enabled = false;
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    await sock.sendMessage(chatId, { text: "❌ Anti-delete DISABLED." });
  } else {
    const status = config.enabled ? "✅ ON" : "❌ OFF";
    await sock.sendMessage(chatId, {
      text: `🔰 *Antidelete Status*\n\nStatus: ${status}\n\n*Usage:*\n.antidelete on\n.antidelete off\n\n_Note: Privacy mode enforced. Messages go to DMs only._`,
    });
  }
}

module.exports = {
  storeMessage,
  handleMessageRevocation,
  handleAntideleteCommand,
};
