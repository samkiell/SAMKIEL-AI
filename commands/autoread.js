const fs = require("fs");
const path = require("path");
const settings = require("../settings");

// Define file path for persistence (if you want to persist this specifically)
// For now, we'll update the runtime settings object and maybe persist if needed.
// Ideally, this should update a JSON file like userGroupData or similar if we want it to stick across restarts without modifying settings.js directly.
// But based on your previous workflow, we might need a dedicated config or just use userGroupData.
// Let's use userGroupData.json which seems to be the place for toggles.

const DATA_FILE = path.join(__dirname, "../data/userGroupData.json");

async function autoReadCommand(sock, chatId, message) {
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
        text: `❌ Usage: ${p}autoread on (enable) or ${p}autoread off (disable)`,
      },
      { quoted: message },
    );
    return;
  }

  // Update runtime setting
  let isEnabled = mode === "on";

  // NOTE: This updates the global settings object for the current session
  settings.featureToggles.SEND_READ = isEnabled;

  // Persist to file to keep state across restarts
  try {
    let data = {};
    if (fs.existsSync(DATA_FILE)) {
      data = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
    }

    // Save under a 'global' key or specific key
    data.sendRead = isEnabled;

    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));

    await sock.sendMessage(
      chatId,
      {
        text: `✅ Auto Read (Blue Tick) has been turned *${mode.toUpperCase()}*!`,
      },
      { quoted: message },
    );
  } catch (err) {
    console.error("Error saving autoread config:", err);
    await sock.sendMessage(
      chatId,
      {
        text: "❌ Failed to save configuration, but setting is active for this session.",
      },
      { quoted: message },
    );
  }
}

module.exports = autoReadCommand;
