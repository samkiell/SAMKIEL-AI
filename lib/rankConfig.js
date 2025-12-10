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
