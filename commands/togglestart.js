const fs = require("fs");
const path = require("path");
const settings = require("../settings");

const DATA_FILE = path.join(__dirname, "../data/userGroupData.json");

async function toggleStartMsgCommand(sock, chatId, message) {
  const text =
    message.message?.conversation || message.message?.extendedTextMessage?.text;
  const args = text.trim().split(/\s+/);
  const mode = args[1]?.toLowerCase();

  const { loadPrefix } = require("../lib/prefix");
  const currentPrefix = loadPrefix();
  const p = currentPrefix === "off" ? "" : currentPrefix;

  if (!mode || (mode !== "on" && mode !== "off")) {
    await sock.sendMessage(
      chatId,
      {
        text: `❌ Usage: ${p}togglestart on (enable start msg) or ${p}togglestart off (disable start msg)`,
      },
      { quoted: message },
    );
    return;
  }

  // Logic inversion: "on" means ENABLE start msg (so DISABLE_START_MESSAGE = false)
  // "off" means DISABLE start msg (so DISABLE_START_MESSAGE = true)
  // Wait, let's clearer.
  // If user says "disablebot", it disables.
  // If user says "togglestart on", they probably mean "Turn ON the start message".

  const disableStartMessage = mode === "off";

  // Update runtime setting
  settings.featureToggles.DISABLE_START_MESSAGE = disableStartMessage;

  // Persist to file
  try {
    let data = {};
    if (fs.existsSync(DATA_FILE)) {
      data = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
    }

    data.disableStartMessage = disableStartMessage;

    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));

    const status = disableStartMessage ? "DISABLED ❌" : "ENABLED ✅";
    await sock.sendMessage(
      chatId,
      {
        text: `✅ Bot Start Message has been ${status}!`,
      },
      { quoted: message },
    );
  } catch (err) {
    console.error("Error saving start msg config:", err);
    await sock.sendMessage(
      chatId,
      {
        text: "❌ Failed to save configuration, but setting is active for this session.",
      },
      { quoted: message },
    );
  }
}

module.exports = toggleStartMsgCommand;
