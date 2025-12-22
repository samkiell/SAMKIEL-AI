const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "../data/disabledBots.json");

function loadDisabledJids() {
  try {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify({ disabledJids: [] }));
      return [];
    }
    const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
    return Array.isArray(data.disabledJids) ? data.disabledJids : [];
  } catch (err) {
    console.error("Error loading disabled bots:", err);
    return [];
  }
}

function saveDisabledJids(jids) {
  try {
    fs.writeFileSync(filePath, JSON.stringify({ disabledJids: jids }, null, 2));
    return true;
  } catch (err) {
    console.error("Error saving disabled bots:", err);
    return false;
  }
}

function isBotDisabled(chatId) {
  const disabledJids = loadDisabledJids();
  return disabledJids.includes(chatId);
}

function disableBot(chatId) {
  const disabledJids = loadDisabledJids();
  if (!disabledJids.includes(chatId)) {
    disabledJids.push(chatId);
    return saveDisabledJids(disabledJids);
  }
  return true;
}

function enableBot(chatId) {
  let disabledJids = loadDisabledJids();
  if (disabledJids.includes(chatId)) {
    disabledJids = disabledJids.filter((id) => id !== chatId);
    return saveDisabledJids(disabledJids);
  }
  return true;
}

module.exports = {
  isBotDisabled,
  disableBot,
  enableBot,
};
