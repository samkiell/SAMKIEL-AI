const videoCommand = require("./commands/video.js");

// Mock socket
const mockSock = {
  sendMessage: async (chatId, content) => {
    console.log(`\n--- [MOCK sendMessage to ${chatId}] ---`);
    if (content.text) console.log(`TEXT: ${content.text}`);
    if (content.image) console.log(`IMAGE URL: ${content.image.url}`);
    if (content.caption) console.log(`CAPTION: ${content.caption}`);
    if (content.video) console.log(`VIDEO URL: ${content.video.url}`);
    if (content.mimetype) console.log(`MIMETYPE: ${content.mimetype}`);
    if (content.fileName) console.log(`FILENAME: ${content.fileName}`);
    console.log("----------------------------------\n");
  },
};

// Function to run test with custom query
async function runTest(query) {
  console.log(`\n>>> Testing with query: "${query}"`);
  const mockMessage = {
    key: { remoteJid: "test-user@s.whatsapp.net" },
    message: {
      conversation: `video ${query}`,
    },
  };

  try {
    await videoCommand(mockSock, "test-chat-id", mockMessage);
  } catch (err) {
    console.error("Test execution failed:", err);
  }
}

// Run tests
(async () => {
  // Test 1: Search Query
  await runTest("despacito");

  // Test 2: Direct URL (Optional, uncomment to test)
  // await runTest("https://www.youtube.com/watch?v=kJQP7kiw5Fk");
})();
