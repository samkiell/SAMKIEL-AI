const fs = require("fs");
const path = require("path");
const { jidNormalizedUser } = require("@whiskeysockets/baileys");

const settings = require("../settings");

/**
 * Owner verification supporting both number-based JIDs, LIDs, and the Bot itself.
 * Reads from ./data/owner.json which should contain:
 * [
 *   { "number": "2348087357158", "lid": "240655909519537" }
 * ]
 */
async function isOwner(senderId) {
  try {
    const ownerPath = path.join(__dirname, "../data/owner.json");
    if (!fs.existsSync(ownerPath)) {
      console.error("⚠️ owner.json not found:", ownerPath);
      return false;
    }

    const owners = JSON.parse(fs.readFileSync(ownerPath, "utf8"));
    if (!Array.isArray(owners)) {
      console.error("❌ owner.json must be an array of objects.");
      return false;
    }

    // Normalize whatever we get from Baileys
    const normalized = jidNormalizedUser(senderId);

    // Extract possible forms
    const raw = normalized.split("@")[0]; // 2348087… or 2406559…
    const full = normalized; // includes suffix

    // Check if sender is the bot itself
    if (
      settings.botNumber &&
      raw === settings.botNumber.replace(/[^0-9]/g, "")
    ) {
      console.log(`✅ Owner recognized as Bot: ${senderId}`);
      return true;
    }

    // Check both number and lid matches
    const match = owners.some((o) => {
      const num = String(o.number || "").replace(/[^0-9]/g, "");
      const lid = String(o.lid || "").replace(/[^0-9]/g, "");
      return (
        raw === num || raw === lid || full.includes(num) || full.includes(lid)
      );
    });

    console.log(
      `🔍 Checking owner: senderId=${senderId}, normalized=${normalized}, raw=${raw}, full=${full}, match=${match}`
    );

    if (match) {
      // Determine if matched via LID or JID
      const isLidMatch = owners.some((o) => {
        const lid = String(o.lid || "").replace(/[^0-9]/g, "");
        return raw === lid || full.includes(lid);
      });
      const logMessage = isLidMatch
        ? "✅ Owner recognized via LID"
        : "✅ Owner recognized via JID";
      console.log(`${logMessage}: ${senderId}`);
      return true;
    } else {
      console.warn(`🚫 Not an owner: ${senderId}`);
      return false;
    }
  } catch (err) {
    console.error("❌ Error checking owner status:", err);
    return false;
  }
}

module.exports = isOwner;
