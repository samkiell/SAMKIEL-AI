const fs = require("fs");
const path = require("path");

// MOCK GLOBALS
global.channelInfo = { contextInfo: { forwardingScore: 999 } };

// MOCK SOCK
const mockSock = {
  sendMessage: async (chatId, content, options) => {
    const text =
      content.text ||
      content.caption ||
      (content.image ? "[Image]" : "[Media]");
    console.log(`[MOCK RESPONSE] ${text}`);
    return { key: { id: "mock_msg_id" } };
  },
};

// COMMANDS TO TEST
const commands = [
  "song",
  "play",
  "video",
  "instagram",
  "facebook",
  "tiktok",
  "twitter",
  "spotify",
  "pinterest",
  "shorts",
  "reddit",
  "threads",
  "soundcloud",
];

async function runTests() {
  console.log("🚀 Starting Downloader Command Tests...\n");

  let passed = 0;
  let failed = 0;

  for (const cmdName of commands) {
    const filePath = path.join(__dirname, "commands", `${cmdName}.js`);

    process.stdout.write(`Testing ${cmdName}.js ... `);

    if (!fs.existsSync(filePath)) {
      console.log("❌ FILE NOT FOUND");
      failed++;
      continue;
    }

    try {
      // 1. Syntax / Require check
      const commandFunc = require(filePath);

      // 2. Execution check (Dummy Call)
      // We pass a dummy message requesting help or invalid url to see if it catches it safely
      const mockMsg = {
        key: { remoteJid: "status@broadcast", id: "123" },
        message: { conversation: `.${cmdName}` }, // Empty args usually trigger usage advice
      };

      await commandFunc(mockSock, "123@s.whatsapp.net", mockMsg);

      console.log("✅ OK (Loaded & Executed)");
      passed++;
    } catch (err) {
      console.log(`❌ FAILED`);
      console.error(err.message);
      failed++;
    }
  }

  console.log(`\n📊 Test Summary: ${passed} Passed, ${failed} Failed.`);
}

runTests();
