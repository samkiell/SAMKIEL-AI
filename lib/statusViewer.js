const fs = require("fs");
const path = require("path");
const settings = require("../settings");
const { downloadMediaMessage } = require("@whiskeysockets/baileys");

/**
 * Handles automatic status viewing and optional downloading/reacting
 * @param {import('@whiskeysockets/baileys').WASocket} sock
 * @param {import('@whiskeysockets/baileys').proto.IWebMessageInfo} message
 */
async function handleAutoStatus(sock, message) {
  // Read dynamic config
  const configPath = path.join(__dirname, "../data/autoStatus.json");
  let config = {
    enabled: false,
    reactOn: false,
    emoji: "👀",
    msgEnabled: false,
    msgContent: "> Viewed by *𝕊𝔸𝕄𝕂𝕀𝔼𝕃 𝔹𝕆𝕋*",
  };

  try {
    if (fs.existsSync(configPath)) {
      config = { ...config, ...JSON.parse(fs.readFileSync(configPath)) };
    }
  } catch (e) {
    console.error("Error reading autoStatus config:", e);
  }

  // Use dynamic config instead of settings.js
  if (!config.enabled) return;

  const chatId = message.key.remoteJid;
  if (chatId !== "status@broadcast") return;

  const senderId = message.key.participant;

  try {
    // 1. View the status: Mark as read
    await sock.readMessages([message.key]);
    console.log(`👁️ Status viewed from: ${senderId}`);

    // 2. Handle Auto Reaction (Isolated Logic)
    await handleStatusReaction(sock, message);

    // 3. Handle Auto Message Reply (Isolated Logic)
    await handleStatusReply(sock, message);

    // 4. Handle Download mode (Managed via settings for now, or could be added to dynamic config)
    // Keeping settings.js for download mode preference "on" vs "no-dl" for now, allowing purely "on" if enabled in JSON
    if (settings.featureToggles.AUTO_STATUS_VIEW === "on") {
      await downloadStatus(sock, message, senderId);
    }
  } catch (error) {
    console.error("Error in handleAutoStatus:", error);
  }
}

/**
 * Isolated logic for status reactions
 */
async function handleStatusReaction(sock, message) {
  // Read dynamic config
  const configPath = path.join(__dirname, "../data/autoStatus.json");
  let config = { reactOn: false, emoji: "👀" };
  try {
    if (fs.existsSync(configPath)) {
      const d = JSON.parse(fs.readFileSync(configPath));
      if (d.reactOn !== undefined) config.reactOn = d.reactOn;
      if (d.emoji) config.emoji = d.emoji;
    }
  } catch (e) {}

  if (!config.reactOn) return;
  const emoji = config.emoji;

  try {
    const senderId = message.key.participant || message.key.remoteJid;

    // Using relayMessage for reliable status reactions
    await sock.relayMessage(
      "status@broadcast",
      {
        reactionMessage: {
          key: {
            remoteJid: "status@broadcast",
            id: message.key.id,
            participant: senderId,
            fromMe: false,
          },
          text: emoji,
        },
      },
      {
        messageId: message.key.id,
        statusJidList: [senderId],
      }
    );
    // Silent success
  } catch (e) {
    console.error("❌ Failed to react to status:", e.message);
  }
}

/**
 * Isolated logic for status reply messages
 */
const repliedStatusIds = new Set();
async function handleStatusReply(sock, message) {
  // Read dynamic config
  const configPath = path.join(__dirname, "../data/autoStatus.json");
  let config = { msgEnabled: false, msgContent: "> Viewed by *𝕊𝔸𝕄𝕂𝕀𝔼𝕃 𝔹𝕆𝕋*" };
  try {
    if (fs.existsSync(configPath)) {
      const d = JSON.parse(fs.readFileSync(configPath));
      if (d.msgEnabled !== undefined) config.msgEnabled = d.msgEnabled;
      if (d.msgContent) config.msgContent = d.msgContent;
    }
  } catch (e) {}

  if (!config.msgEnabled || !config.msgContent) return;
  const statusMsg = config.msgContent;

  // Prevent duplicate replies (Optimistic Locking)
  if (repliedStatusIds.has(message.key.id)) return;
  repliedStatusIds.add(message.key.id);

  try {
    const senderId = message.key.participant;

    // Strict validation: Must have participant (user JID) and not be self
    if (!senderId || message.key.fromMe) {
      // If validation fails, remove the lock so we might try again if conditions change (unlikely) or just cleanup
      repliedStatusIds.delete(message.key.id);
      return;
    }

    // Use configured message directly (allows full customization)
    // Default should be set to: > Viewed by *𝕊𝔸𝕄𝕂𝕀𝔼𝕃 𝔹𝕆𝕋*
    const finalMsg = statusMsg;

    // Send direct message to the user, quoting their status
    try {
      await sock.sendMessage(
        senderId,
        { text: finalMsg, ...global.channelInfo },
        { quoted: message }
      );
    } catch (sendError) {
      console.error(
        "⚠️ Failed to quote status, sending plain text:",
        sendError.message
      );
      // Fallback: Send without quote
      await sock.sendMessage(senderId, {
        text: finalMsg,
        ...global.channelInfo,
      });
    }

    console.log(`✉️ Status reply sent to: ${senderId}`);

    // Optional cleanup to prevent memory leak (remove after 24h)
    setTimeout(
      () => repliedStatusIds.delete(message.key.id),
      24 * 60 * 60 * 1000
    );
  } catch (e) {
    console.error("❌ Failed to send status reply:", e.message);
    // On critical error, remove lock? Maybe better to keep it to prevent loop
  }
}

/**
 * Downloads status media to the local filesystem
 */
async function downloadStatus(sock, message, senderId) {
  try {
    if (!message.message) return;
    const messageKeys = Object.keys(message.message);
    const messageType = messageKeys[0];
    const supportedTypes = ["imageMessage", "videoMessage"];

    if (!supportedTypes.includes(messageType)) return;

    const buffer = await downloadMediaMessage(message, "buffer", {});
    const ext = messageType === "imageMessage" ? "jpg" : "mp4";
    const fileName = `status_${senderId.split("@")[0]}_${Date.now()}.${ext}`;
    const downloadDir = path.join(__dirname, "../data/status_downloads");

    if (!fs.existsSync(downloadDir)) {
      fs.mkdirSync(downloadDir, { recursive: true });
    }

    const filePath = path.join(downloadDir, fileName);
    fs.writeFileSync(filePath, buffer);

    console.log(`📥 Status downloaded: ${filePath}`);
  } catch (error) {
    console.error("Error downloading status:", error);
  }
}

module.exports = { handleAutoStatus };
