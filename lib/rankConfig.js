const fs = require("fs");
const path = require("path");
const configPath = path.join(__dirname, "../data/rankConfig.json");

// Ensure data file exists
if (!fs.existsSync(configPath)) {
  fs.writeFileSync(configPath, JSON.stringify({}));
}

function getRankConfig() {
  try {
    return JSON.parse(fs.readFileSync(configPath));
  } catch (e) {
    return {};
  }
}

function saveRankConfig(data) {
  fs.writeFileSync(configPath, JSON.stringify(data, null, 2));
}

function isRankEnabled(chatId) {
  const data = getRankConfig();
  // Check global setting first (key: "global") - default to true
  if (data.global === false) return false;

  // Check specific chat setting - default to true
  return data[chatId] !== false;
}

function setRankEnabled(chatId, enabled) {
  const data = getRankConfig();
  data[chatId] = enabled;
  saveRankConfig(data);
}

function setGlobalRankEnabled(enabled) {
  const data = getRankConfig();
  data.global = enabled;
  saveRankConfig(data);
}

module.exports = { isRankEnabled, setRankEnabled, setGlobalRankEnabled };
