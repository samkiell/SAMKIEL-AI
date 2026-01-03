const fs = require("fs");
const path = require("path");
const configPath = path.join(__dirname, "../data/rankConfig.json");

// Ensure data file exists
if (!fs.existsSync(configPath)) {
  const settings = require("../settings");
  fs.writeFileSync(
    configPath,
    JSON.stringify(
      { global: settings.featureToggles.RANKING ?? false },
      null,
      2
    )
  );
}

function getRankConfig() {
  const settings = require("../settings");
  try {
    const data = JSON.parse(fs.readFileSync(configPath));
    if (data.global === undefined) {
      data.global = settings.featureToggles.RANKING ?? false;
    }
    return data;
  } catch (e) {
    return { global: settings.featureToggles.RANKING ?? false };
  }
}

function saveRankConfig(data) {
  fs.writeFileSync(configPath, JSON.stringify(data, null, 2));
}

function isRankEnabled(chatId) {
  const data = getRankConfig();
  // Check global setting first (key: "global") - default to false
  if (data.global === true) return true;
  if (data.global === false) return false;

  // Check specific chat setting - default to false
  return data[chatId] === true;
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
