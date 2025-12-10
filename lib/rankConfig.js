const fs = require("fs");
const path = "./data/rankConfig.json";

// Ensure data file exists
if (!fs.existsSync(path)) {
  fs.writeFileSync(path, JSON.stringify({}));
}

function getRankConfig() {
  try {
    return JSON.parse(fs.readFileSync(path));
  } catch (e) {
    return {};
  }
}

function saveRankConfig(data) {
  fs.writeFileSync(path, JSON.stringify(data, null, 2));
}

function isRankEnabled(chatId) {
  const data = getRankConfig();
  // Default to true if not set
  // This means if the chatId is NOT in the file, it is enabled (formatted as enabled by default)
  // If data[chatId] is explicitly false, then it is disabled.
  return data[chatId] !== false;
}

function setRankEnabled(chatId, enabled) {
  const data = getRankConfig();
  data[chatId] = enabled;
  saveRankConfig(data);
}

module.exports = { isRankEnabled, setRankEnabled };
