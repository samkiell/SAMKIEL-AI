const fs = require("fs");
const path = require("path");
const { jidNormalizedUser } = require("@whiskeysockets/baileys");
const settings = require("../settings");

const ownerPath = path.join(__dirname, "../data/owner.json");

/**
 * Normalizes a JID or number to a clean numeric string
 * Handles both standard JID (@s.whatsapp.net) and LID (@lid) formats
 */
function normalizeToNumber(id) {
  if (!id) return "";
  // Manually strip device ID (:) and domain (@) to ensure clean number
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
  // Return default structure
  return {
    superOwner: [normalizeToNumber(settings.ownerNumber)],
    owners: [],
  };
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
 * This self-heals the owner list by adding missing LIDs
 *
 * @param {object} sock - Baileys socket (optional, for LID lookup)
 * @param {string} senderId - The sender's JID/LID
 * @returns {Promise<boolean>} - True if sender is owner
 */
async function resolveAndUpdateOwnerLid(sock, senderId) {
  if (!sock || !senderId) return false;

  try {
    const senderNum = normalizeToNumber(senderId);
    if (!senderNum) return false;

    const data = loadOwnerData();
    const ownersList = Array.isArray(data.owners) ? data.owners : [];

    // Find if sender matches any existing owner by JID number
    let matchedOwner = ownersList.find((o) => {
      const num = normalizeToNumber(o?.number || o?.jid || "");
      return num === senderNum;
    });

    // If sender number matches an owner but might be using LID
    if (!matchedOwner) {
      // Check if it's an LID that matches
      matchedOwner = ownersList.find((o) => {
        const lid = normalizeToNumber(o?.lid || "");
        return lid === senderNum;
      });
    }

    // If we found a match by number but the LID field differs or is missing
    if (matchedOwner) {
      const currentLid = normalizeToNumber(matchedOwner?.lid || "");

      // If sender is using a different ID than stored, try to resolve LID
      if (currentLid !== senderNum) {
        // The sender might be using their LID - update the record
        try {
          const ownerJid = `${normalizeToNumber(matchedOwner.number)}@s.whatsapp.net`;
          const waResult = await sock.onWhatsApp(ownerJid).catch(() => null);

          if (waResult && waResult[0]?.lid) {
            const resolvedLid = normalizeToNumber(waResult[0].lid);
            if (resolvedLid && resolvedLid !== currentLid) {
              matchedOwner.lid = resolvedLid;
              saveOwnerData(data);
              console.log(
                `[Owner LID] Updated LID for ${matchedOwner.number}: ${resolvedLid}`,
              );
            }
          }
        } catch (e) {
          // Silently fail LID lookup
        }
      }
      return true;
    }

    // Check if sender matches superOwner
    const superOwners = Array.isArray(data.superOwner)
      ? data.superOwner
      : [data.superOwner];
    const isSuperOwnerMatch = superOwners.some(
      (s) => normalizeToNumber(s) === senderNum,
    );

    if (isSuperOwnerMatch) {
      // Super owner using LID - add them to owners list with LID
      try {
        const superOwnerNum = superOwners.find(
          (s) => normalizeToNumber(s) === senderNum,
        );
        const superJid = `${normalizeToNumber(superOwnerNum)}@s.whatsapp.net`;
        const waResult = await sock.onWhatsApp(superJid).catch(() => null);

        if (waResult && waResult[0]?.lid) {
          const lid = normalizeToNumber(waResult[0].lid);

          // Check if this owner already exists
          const exists = ownersList.find(
            (o) =>
              normalizeToNumber(o.number) === normalizeToNumber(superOwnerNum),
          );

          if (exists) {
            exists.lid = lid;
          } else {
            ownersList.push({
              number: normalizeToNumber(superOwnerNum),
              lid: lid,
            });
          }

          data.owners = ownersList;
          saveOwnerData(data);
          console.log(`[Owner LID] Auto-added/updated super owner LID: ${lid}`);
        }
      } catch (e) {
        // Silently fail
      }
      return true;
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
      if (
        data.superOwner.some(
          (s) => String(s).replace(/[^0-9]/g, "") === senderNum,
        )
      ) {
        return true;
      }
    } else {
      const superOwnerNum = String(data.superOwner || "").replace(
        /[^0-9]/g,
        "",
      );
      if (senderNum === superOwnerNum) return true;
    }

    // Also check owners array for LID match (super owners might message via LID)
    const ownersList = Array.isArray(data.owners) ? data.owners : [];
    const superOwnerNums = Array.isArray(data.superOwner)
      ? data.superOwner.map((s) => normalizeToNumber(s))
      : [normalizeToNumber(data.superOwner)];

    for (const owner of ownersList) {
      const ownerNum = normalizeToNumber(owner?.number || "");
      const ownerLid = normalizeToNumber(owner?.lid || "");

      if (superOwnerNums.includes(ownerNum)) {
        // This owner entry is for a super owner
        if (senderNum === ownerNum || senderNum === ownerLid) {
          return true;
        }
      }
    }

    return false;
  } catch (err) {
    console.error("Error in isSuperOwner:", err);
    return false;
  }
}

/**
 * Check if the sender is an owner.
 * Owners include:
 * 1. The superOwner (also checks LID)
 * 2. The ownerNumber defined in settings.js
 * 3. The bot's own number
 * 4. Any owner listed in owner.json's owners array (checks both number AND lid)
 *
 * @param {string} senderId - Sender's JID
 * @param {object} sock - Optional: Baileys socket for LID resolution
 */
async function isOwner(senderId, sock = null) {
  try {
    const senderNum = normalizeToNumber(senderId);
    if (!senderNum) return false;

    // 1. SuperOwner check (includes LID matching)
    if (isSuperOwner(senderId)) return true;

    // 2. Settings.js owner check
    const settingsOwner = String(
      settings.ownerNumber || "2348087357158",
    ).replace(/[^0-9]/g, "");
    if (senderNum === settingsOwner) return true;

    // 3. Bot's own number check
    const botNum = String(settings.botNumber || "").replace(/[^0-9]/g, "");
    if (botNum && senderNum === botNum) return true;

    // 3.5. Global runtime bot check (fixes issue where settings.botNumber is empty)
    if (global.botUserJid) {
      const globalBotNum = normalizeToNumber(global.botUserJid);
      if (globalBotNum && senderNum === globalBotNum) return true;
    }

    // 4. owner.json array check - BOTH number AND lid fields
    const data = loadOwnerData();
    const ownersList = Array.isArray(data.owners) ? data.owners : [];

    const isMatched = ownersList.some((owner) => {
      // Support legacy formats: owners can be strings/numbers or objects.
      if (typeof owner === "string" || typeof owner === "number") {
        const v = normalizeToNumber(owner);
        return senderNum === v;
      }
      const num = normalizeToNumber(owner?.number || owner?.jid || "");
      const lid = normalizeToNumber(owner?.lid || "");
      // Match if sender matches either JID number OR LID
      return senderNum === num || (lid && senderNum === lid);
    });

    if (isMatched) {
      // If we have a socket, try to update LID for self-healing
      if (sock) {
        await resolveAndUpdateOwnerLid(sock, senderId);
      }
      return true;
    }

    // 5. Runtime LID resolution attempt
    if (sock) {
      const resolved = await resolveAndUpdateOwnerLid(sock, senderId);
      if (resolved) return true;
    }

    return false;
  } catch (err) {
    console.error("Error in isOwner:", err);
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
