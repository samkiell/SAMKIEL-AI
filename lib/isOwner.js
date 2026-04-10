const fs = require("fs");
const path = require("path");
const { jidNormalizedUser } = require("@whiskeysockets/baileys");
const settings = require("../settings");

const ownerPath = path.join(__dirname, "../data/owner.json");

/**
 * Normalizes a JID or number to a clean numeric string
 */
function normalizeToNumber(id) {
  if (!id) return "";
  // Handle objects or strings
  const strId =
    typeof id === "object" ? id?.number || id?.jid || id?.id || "" : String(id);
  return strId
    .split(":")[0] // Remove device suffix
    .split("@")[0] // Remove domain
    .replace(/[^0-9]/g, ""); // Keep only digits
}

/**
 * Load owner data from file safely
 */
function loadOwnerData() {
  try {
    if (fs.existsSync(ownerPath)) {
      const data = JSON.parse(fs.readFileSync(ownerPath, "utf8"));
      // Ensure structure
      if (!data.superOwner)
        data.superOwner = [normalizeToNumber(settings.ownerNumber)];
      if (!data.owners) data.owners = [];
      return data;
    }
  } catch (e) {
    console.error("Error loading owner.json:", e);
  }
  return { superOwner: [normalizeToNumber(settings.ownerNumber)], owners: [] };
}

/**
 * Save owner data to file
 */
function saveOwnerData(data) {
  try {
    fs.writeFileSync(ownerPath, JSON.stringify(data, null, 2));
    return true;
  } catch (e) {
    console.error("Error saving owner.json:", e);
    return false;
  }
}

/**
 * Runtime LID resolution and auto-append to owner.json
 */
async function resolveAndUpdateOwnerLid(sock, senderId) {
  if (!sock || !senderId) return false;

  try {
    const targetJid = senderId.includes("@")
      ? senderId
      : normalizeToNumber(senderId) + "@s.whatsapp.net";
    const result = await sock.onWhatsApp(targetJid).catch(() => null);
    if (result && result.length > 0) {
      const resolvedNum = normalizeToNumber(result[0].jid);
      const resolvedLid = result[0].lid
        ? normalizeToNumber(result[0].lid)
        : null;
      if (resolvedNum) {
        const data = loadOwnerData();
        let ownersList = Array.isArray(data.owners) ? data.owners : [];
        const superOwners = Array.isArray(data.superOwner)
          ? data.superOwner
          : [data.superOwner];
        const isSuperOwnerMatch = superOwners.some(
          (s) => normalizeToNumber(s) === resolvedNum,
        );
        const ownerIndex = ownersList.findIndex((o) => {
          const num = normalizeToNumber(typeof o === "object" ? o.number : o);
          return num === resolvedNum;
        });
        const alreadyHasLid =
          ownerIndex !== -1 &&
          typeof ownersList[ownerIndex] === "object" &&
          ownersList[ownerIndex].lid;
        if (
          !alreadyHasLid &&
          (ownerIndex !== -1 || isSuperOwnerMatch) &&
          resolvedLid
        ) {
          if (ownerIndex !== -1) {
            ownersList[ownerIndex].lid = resolvedLid;
          } else {
            ownersList.push({ number: resolvedNum, lid: resolvedLid });
          }
          saveOwnerData({ ...data, owners: ownersList });
        }
      }
    }
  } catch (e) {
    console.error("resolveAndUpdateOwnerLid Error:", e);
  }
}
function isSuperOwner(senderId) {
  try {
    const data = loadOwnerData();
    const senderNum = normalizeToNumber(senderId);

    // Check superOwner array
    const superOwners = Array.isArray(data.superOwner)
      ? data.superOwner
      : [data.superOwner];
    if (superOwners.some((s) => normalizeToNumber(s) === senderNum)) {
      return true;
    }

    // Also check owners array for LID mapping to superOwner
    const ownersList = Array.isArray(data.owners) ? data.owners : [];
    const superNums = superOwners.map((s) => normalizeToNumber(s));

    // If sender is an LID, check if it maps to a super owner number
    const match = ownersList.find((o) => {
      if (typeof o !== "object") return false;
      const lid = normalizeToNumber(o.lid);
      return lid && lid === senderNum;
    });

    if (match && superNums.includes(normalizeToNumber(match.number))) {
      return true;
    }

    return false;
  } catch (err) {
    return false;
  }
}

/**
 * Check if sender is owner (async version with LID resolution)
 */
async function isOwner(senderId, sock = null, messageKey = null) {
  try {
    // 1. Quick fromMe check - if message is from the bot itself, it's owner
    if (messageKey?.fromMe) return true;

    // 2. Check against bot's own ID from socket
    if (sock?.user?.id) {
      const botId = normalizeToNumber(sock.user.id);
      const senderIdNum = normalizeToNumber(senderId);
      if (botId && botId === senderIdNum) return true;
    }

    const senderNum = normalizeToNumber(senderId);
    if (!senderNum) return false;

    // 3. SuperOwner check
    if (isSuperOwner(senderId)) {
      if (sock) resolveAndUpdateOwnerLid(sock, senderId); // Fire and forget update
      return true;
    }

    // 4. Settings Owner (Fallback)
    const settingsOwner = normalizeToNumber(
      settings.ownerNumber || "2348087357158",
    );
    if (senderNum === settingsOwner) {
      if (sock) resolveAndUpdateOwnerLid(sock, senderId);
      return true;
    }

    // 5. Global Bot JID
    const globalBotJid = normalizeToNumber(global.botUserJid || "");
    if (globalBotJid && senderNum === globalBotJid) return true;

    // 6. Owner List (Dynamic)
    const data = loadOwnerData();
    const ownersList = Array.isArray(data.owners) ? data.owners : [];

    const isMatched = ownersList.some((owner) => {
      const num = normalizeToNumber(
        typeof owner === "object" ? owner.number : owner,
      );
      const lid =
        typeof owner === "object" ? normalizeToNumber(owner.lid || "") : "";
      return senderNum === num || (lid && senderNum === lid);
    });

    if (isMatched) {
      if (sock) resolveAndUpdateOwnerLid(sock, senderId);
      return true;
    }

    return false;
  } catch (err) {
    console.error("isOwner Error:", err);
    return false;
  }
}

/**
 * Synchronous owner check
 */
function isOwnerSync(senderId, messageKey = null) {
  try {
    if (messageKey?.fromMe) return true;

    const senderNum = normalizeToNumber(senderId);
    if (!senderNum) return false;

    if (isSuperOwner(senderId)) return true;

    const settingsOwner = normalizeToNumber(
      settings.ownerNumber || "2348087357158",
    );
    if (senderNum === settingsOwner) return true;

    const globalBotJid = normalizeToNumber(global.botUserJid || "");
    if (globalBotJid && senderNum === globalBotJid) return true;

    const data = loadOwnerData();
    const ownersList = Array.isArray(data.owners) ? data.owners : [];

    return ownersList.some((owner) => {
      const num = normalizeToNumber(
        typeof owner === "object" ? owner.number : owner,
      );
      const lid =
        typeof owner === "object" ? normalizeToNumber(owner.lid || "") : "";
      return senderNum === num || (lid && senderNum === lid);
    });
  } catch (err) {
    console.error("isOwnerSync Error:", err);
    return false;
  }
}

module.exports = {
  isOwner,
  isOwnerSync,
  isSuperOwner,
  normalizeToNumber,
  loadOwnerData,
  saveOwnerData,
  resolveAndUpdateOwnerLid,
};
