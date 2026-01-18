const fs = require("fs");
const path = require("path");

// MOCK GLOBALS
global.channelInfo = { contextInfo: { forwardingScore: 999 } };

// MOCK SOCK
// We track success if sendMessage is called with video/audio/image
let testSuccess = false;
let testOutput = "";

const mockSock = {
  sendMessage: async (chatId, content, options) => {
    if (content.audio || content.video || content.image) {
      console.log(
        `[SUCCESS] Sent Media: ${Object.keys(content).find((k) => ["audio", "video", "image"].includes(k))}`,
      );
      testSuccess = true;
    } else if (content.text) {
      console.log(`[TEXT] ${content.text}`);
      if (content.text.includes("Failed") || content.text.includes("error")) {
        // Failure message
      }
    }
    return { key: { id: "mock_msg_id" } };
  },
};

// TEST CASES
const TEST_CASES = [
  {
    cmd: "spotify",
    file: "spotify.js",
    url: "https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT", // Never Gonna Give You Up
    args: ["https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT"],
  },
  {
    cmd: "soundcloud",
    file: "soundcloud.js",
    url: "https://soundcloud.com/octobersveryown/drake-gods-plan",
    args: ["https://soundcloud.com/octobersveryown/drake-gods-plan"],
  },
  {
    cmd: "pinterest",
    file: "pinterest.js",
    url: "https://www.pinterest.com/pin/49328558396079946/", // Random art pin
    args: ["https://www.pinterest.com/pin/49328558396079946/"],
  },
  // Add more if needed
];

async function runRealTests() {
  console.log("🚀 STARTING REAL DOWNLOADER TESTS (API CHECK)...\n");

  for (const test of TEST_CASES) {
    const filePath = path.join(__dirname, "commands", test.file);

    console.log(`\n------------------------------------------------`);
    console.log(`🧪 Testing ${test.cmd.toUpperCase()} with URL: ${test.url}`);

    if (!fs.existsSync(filePath)) {
      console.log("❌ FILE NOT FOUND");
      continue;
    }

    testSuccess = false;

    try {
      const commandFunc = require(filePath);

      // Mock Message
      const mockMsg = {
        key: { remoteJid: "123@s.whatsapp.net", id: "123" },
        message: {
          conversation: `.${test.cmd} ${test.url}`,
          extendedTextMessage: { text: `.${test.cmd} ${test.url}` },
        },
      };

      // Execute
      // Note: Some commands take (sock, chatId, message, args)
      // Some take (sock, chatId, message)
      await commandFunc(mockSock, "123@s.whatsapp.net", mockMsg, test.args);

      if (testSuccess) {
        console.log(`✅ RESULT: PASS (Media Sent)`);
      } else {
        console.log(`❌ RESULT: FAIL (No Media Sent)`);
      }
    } catch (err) {
      console.log(`❌ RESULT: CRASH`);
      console.error(err);
    }
  }

  console.log(`\n------------------------------------------------`);
  console.log("🏁 TESTS COMPLETED");
}

runRealTests();
