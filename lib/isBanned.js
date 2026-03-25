const fs = require("fs");

function normalizeToDigits(id) {
  if (!id) return "";
  return String(id)
    .split(":")[0]
    .split("@")[0]
    .replace(/[^0-9]/g, "");
}

function isBanned(userId) {
  try {
    const senderNum = normalizeToDigits(userId);
    if (!senderNum) return false;

    let bannedUsers = [];
    try {
      bannedUsers = JSON.parse(fs.readFileSync("./data/banned.json", "utf8"));
    } catch {
      bannedUsers = [];
    }

    return bannedUsers.some((b) => normalizeToDigits(b) === senderNum);
  } catch (error) {
    console.error("Error checking banned status:", error);
    return false;
  }
}

module.exports = { isBanned };