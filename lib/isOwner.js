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
  return jidNormalizedUser(id)
    .split("@")[0]
    .replace(/[^0-9]/g, "");
}

/**
 * Check if the sender is the global superOwner defined in owner.json
 */
function isSuperOwner(senderId) {
  try {
    if (!fs.existsSync(ownerPath)) return false;
    const data = JSON.parse(fs.readFileSync(ownerPath, "utf8"));
    const senderNum = normalizeToNumber(senderId);

    if (Array.isArray(data.superOwner)) {
      return data.superOwner.some(
        (s) => String(s).replace(/[^0-9]/g, "") === senderNum
      );
    } else {
      const superOwnerNum = String(data.superOwner || "").replace(
        /[^0-9]/g,
        ""
      );
      return senderNum === superOwnerNum;
    }
  } catch (err) {
    console.error("Error in isSuperOwner:", err);
    return false;
  }
}

/**
 * Check if the sender is an owner.
 * Owners include:
 * 1. The superOwner
 * 2. The ownerNumber defined in settings.js
 * 3. The bot's own number
 * 4. Any owner listed in owner.json's owners array
 */
async function isOwner(senderId) {
  try {
    const senderNum = normalizeToNumber(senderId);
    if (!senderNum) return false;

    // 1. SuperOwner check (overrides everything)
    if (isSuperOwner(senderId)) return true;

    // 2. Settings.js owner check
    const settingsOwner = String(
      settings.ownerNumber || "2348087357158"
    ).replace(/[^0-9]/g, "");
    if (senderNum === settingsOwner) return true;

    // 3. Bot's own number check
    const botNum = String(settings.botNumber || "").replace(/[^0-9]/g, "");
    if (botNum && senderNum === botNum) return true;

    // 4. owner.json array check
    if (fs.existsSync(ownerPath)) {
      const data = JSON.parse(fs.readFileSync(ownerPath, "utf8"));
      const ownersList = Array.isArray(data.owners) ? data.owners : [];

      /* DEBUG: Trace Owner Check */
      console.log(
        `[DEBUG isOwner] Checking ${senderNum} against ${ownersList.length} owners...`
      );

      const isMatched = ownersList.some((owner) => {
        const num = String(owner.number || "").replace(/[^0-9]/g, "");
        const lid = String(owner.lid || "").replace(/[^0-9]/g, "");
        // Use inclusive matching to handle potential device ID suffixes
        const match =
          (num && senderNum.includes(num)) || (lid && senderNum.includes(lid));
        if (match)
          console.log(
            `[DEBUG isOwner] MATCH FOUND for ${senderNum} in owners list`
          );
        return match;
      });

      if (isMatched) return true;
    }

    console.log(`[DEBUG isOwner] FAILED all checks for ${senderNum}`);
    return false;
  } catch (err) {
    console.error("Error in isOwner:", err);
    return false;
  }
}

module.exports = {
  isOwner,
  isSuperOwner,
};
