const fs = require("fs");
const path = require("path");

// MOCK GLOBALS
global.channelInfo = { contextInfo: { forwardingScore: 999 } };

// MOCK SOCK
const mockSock = {
  sendMessage: async (chatId, content, options) => {
    // console.log(`[SOCK] Sent:`, content.text || "Media Object");
    return { key: { id: "mock_msg_id" } };
  },
};

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
  console.log("🚀 Verifying Downloader Commands Integration...\n");

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
      const commandFunc = require(filePath);
      if (typeof commandFunc !== "function")
        throw new Error("Does not export a function");

      // Basic Sanity Check: Ensure it attempts to run without syntax error
      // Passing empty message should trigger usage help, not crash.
      await commandFunc(
        mockSock,
        "123@s.whatsapp.net",
        {
          key: { id: "123" },
          message: { conversation: "" },
        },
        [],
      );

      console.log("✅ OK");
      passed++;
    } catch (err) {
      console.log(`❌ FAILED`);
      console.error("   Error:", err.message);
      failed++;
    }
  }

  console.log(`\n📊 Summary: ${passed} Valid, ${failed} Invalid.`);
}

runTests();
