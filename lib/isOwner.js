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
  return String(id)
    .split(":")[0]
    .split("@")[0]
    .replace(/[^0-9]/g, "");
}

/**
 * Load owner data from file safely
 */
function loadOwnerData() {
  try {
    if (fs.existsSync(ownerPath)) {
      return JSON.parse(fs.readFileSync(ownerPath, "utf8"));
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
 * Uses logic similar to lid.js to ensure accurate fetching
 */
async function resolveAndUpdateOwnerLid(sock, senderId) {
  if (!sock || !senderId) return false;

  try {
    const senderNum = normalizeToNumber(senderId);
    if (!senderNum) return false;

    // Load fresh data
    const data = loadOwnerData();
    let ownersList = Array.isArray(data.owners) ? data.owners : [];

    // Check if handling Super Owner
    const superOwners = Array.isArray(data.superOwner)
      ? data.superOwner
      : [data.superOwner];
    const isSuperOwnerMatch = superOwners.some(
      (s) => normalizeToNumber(s) === senderNum,
    );

    // Find in owners list (handle strings vs objects)
    let ownerIndex = ownersList.findIndex((o) => {
      const num =
        typeof o === "string" || typeof o === "number"
          ? normalizeToNumber(o)
          : normalizeToNumber(o?.number || o?.jid || "");
      const lid = typeof o === "object" ? normalizeToNumber(o?.lid || "") : "";
      return num === senderNum || (lid && lid === senderNum);
    });

    const alreadyHasLid =
      ownerIndex !== -1 &&
      typeof ownersList[ownerIndex] === "object" &&
      ownersList[ownerIndex].lid;

    // Only proceed if we need to add LID or user is new super owner entry
    if (!alreadyHasLid && (ownerIndex !== -1 || isSuperOwnerMatch)) {
      // Logic from lid.js: Query WhatsApp
      const targetJid = senderNum + "@s.whatsapp.net";
      const result = await sock.onWhatsApp(targetJid).catch(() => null);

      if (result && result.length > 0 && result[0].lid) {
        const resolvedLid = normalizeToNumber(result[0].lid);

        if (ownerIndex !== -1) {
          // Update existing entry
          const existing = ownersList[ownerIndex];
          if (typeof existing === "string" || typeof existing === "number") {
            ownersList[ownerIndex] = {
              number: normalizeToNumber(existing),
              lid: resolvedLid,
            };
          } else {
            ownersList[ownerIndex].lid = resolvedLid;
          }
        } else if (isSuperOwnerMatch) {
          // Add new entry for superOwner
          ownersList.push({ number: senderNum, lid: resolvedLid });
        }

        data.owners = ownersList;
        saveOwnerData(data);
        console.log(`[Owner] Linked LID ${resolvedLid} to ${senderNum}`);
        return true;
      }
    }

    return false;
  } catch (e) {
    console.error("Error in resolveAndUpdateOwnerLid:", e);
    return false;
  }
}

/**
 * Check if the sender is the global superOwner defined in owner.json
 */
function isSuperOwner(senderId) {
  try {
    const data = loadOwnerData();
    const senderNum = normalizeToNumber(senderId);

    // Check superOwner array
    if (Array.isArray(data.superOwner)) {
      if (data.superOwner.some((s) => normalizeToNumber(s) === senderNum))
        return true;
    } else {
      if (normalizeToNumber(data.superOwner) === senderNum) return true;
    }

    // Also check owners array for LID mapping to superOwner
    const ownersList = Array.isArray(data.owners) ? data.owners : [];
    const superNums = (
      Array.isArray(data.superOwner) ? data.superOwner : [data.superOwner]
    ).map((s) => normalizeToNumber(s));

    // If sender is an LID, check if it maps to a super owner number
    const match = ownersList.find((o) => {
      if (typeof o !== "object") return false;
      return normalizeToNumber(o.lid) === senderNum;
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
 * Check if sender is owner
 */
async function isOwner(senderId, sock = null) {
  try {
    const senderNum = normalizeToNumber(senderId);
    if (!senderNum) return false;

    // 1. SuperOwner
    if (isSuperOwner(senderId)) {
      if (sock) await resolveAndUpdateOwnerLid(sock, senderId);
      return true;
    }

    // 2. Settings Owner
    const settingsOwner = normalizeToNumber(
      settings.ownerNumber || "2348087357158",
    );
    if (senderNum === settingsOwner) {
      if (sock) await resolveAndUpdateOwnerLid(sock, senderId);
      return true;
    }

    // 3. Bot Number
    const botNum = normalizeToNumber(
      settings.botNumber || global.botUserJid || "",
    );
    if (botNum && senderNum === botNum) return true;

    // 4. Owner List
    const data = loadOwnerData();
    const ownersList = Array.isArray(data.owners) ? data.owners : [];

    const isMatched = ownersList.some((owner) => {
      if (typeof owner === "string" || typeof owner === "number") {
        return senderNum === normalizeToNumber(owner);
      }
      const num = normalizeToNumber(owner?.number || owner?.jid || "");
      const lid = normalizeToNumber(owner?.lid || "");
      return senderNum === num || (lid && senderNum === lid);
    });

    if (isMatched) {
      // If matched via number but LID checking/updating is needed (or vice versa)
      if (sock) await resolveAndUpdateOwnerLid(sock, senderId);
      return true;
    }

    return false;
  } catch (err) {
    console.error("isOwner Error:", err);
    return false;
  }
}

module.exports = {
  isOwner,
  isSuperOwner,
  normalizeToNumber,
  loadOwnerData,
  saveOwnerData,
  resolveAndUpdateOwnerLid,
};
