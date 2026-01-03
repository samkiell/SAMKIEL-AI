const fs = require("fs");
const settings = require("../settings");
const { getAntiCall } = require("../lib/index");

async function pluginCommand(sock, chatId, message) {
  // Read dynamic settings
  let isRankGlobal = settings.featureToggles.RANKING;
  try {
    if (fs.existsSync("./data/rankConfig.json")) {
      const d = JSON.parse(fs.readFileSync("./data/rankConfig.json"));
      if (d.global !== undefined) isRankGlobal = d.global;
    }
  } catch (e) {}

  let isAutoReactGlobal = settings.featureToggles.AUTO_REACTION;
  try {
    if (fs.existsSync("./data/userGroupData.json")) {
      const d = JSON.parse(fs.readFileSync("./data/userGroupData.json"));
      if (d.autoReaction !== undefined) isAutoReactGlobal = d.autoReaction;
    }
  } catch (e) {}

  // Get Anti-Call Status
  const isAntiCallEnabled = await getAntiCall();

  // Construct status list
  const statusList = [
    `🔌 *Auto Status View:* ${settings.featureToggles.AUTO_STATUS_VIEW}`,
    `🔌 *Always Online:* ${
      settings.featureToggles.ALWAYS_ONLINE ? "On" : "Off"
    }`,
    `🔌 *Anti Delete:* ${settings.featureToggles.ANTI_DELETE ? "On" : "Off"}`,
    `🔌 *Auto Read (Blue Tick):* ${
      settings.featureToggles.SEND_READ ? "On" : "Off"
    }`,
    `🔌 *Private Mode (DM Only):* ${
      settings.featureToggles.PERSONAL_MESSAGE ? "On" : "Off"
    }`,
    `🔌 *Auto Reaction:* ${isAutoReactGlobal ? "On" : "Off"}`,
    `🔌 *Ranking:* ${isRankGlobal ? "On" : "Off"}`,
    `🔌 *Anti-Call:* ${isAntiCallEnabled ? "On" : "Off"}`,
  ].join("\n");

  const text = `🤖 *System Configuration & Plugins*\n\n${statusList}\n\n_Use specific commands to toggle these features (e.g., .anticall on/off, .rankon/off)_`;

  await sock.sendMessage(
    chatId,
    {
      text: text,
      ...global.channelInfo,
    },
    { quoted: message }
  );
}

module.exports = pluginCommand;
