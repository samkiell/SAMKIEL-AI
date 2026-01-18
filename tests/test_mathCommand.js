/**
 * Test Math Command Integration
 */

const mathCommand = require("../commands/math");

console.log("=== Testing Math Command ===\n");

// Mock sock object
const mockSock = {
  sendMessage: async (chatId, content, options) => {
    console.log(`📤 Message to ${chatId}:`);
    if (content.text) {
      console.log(`   Text: ${content.text.substring(0, 100)}...`);
    }
    if (content.react) {
      console.log(`   React: ${content.react.text}`);
    }
    if (content.edit) {
      console.log(`   Edit message`);
    }
    return { key: { id: "test-key-123" } };
  },
};

// Test cases
const testMessages = [
  {
    name: "Valid equation",
    message: {
      message: {
        conversation: ".math 2x + 5 = 15",
      },
      key: { id: "msg1" },
    },
  },
  {
    name: "Valid calculation",
    message: {
      message: {
        conversation: ".cal 25 × 4 + 10",
      },
      key: { id: "msg2" },
    },
  },
  {
    name: "Empty command",
    message: {
      message: {
        conversation: ".math",
      },
      key: { id: "msg3" },
    },
  },
  {
    name: "Not a math problem",
    message: {
      message: {
        conversation: ".math hello how are you",
      },
      key: { id: "msg4" },
    },
  },
];

async function runTest(testCase) {
  console.log(`\n🧪 Test: ${testCase.name}`);
  console.log(`   Input: ${testCase.message.message.conversation}`);
  try {
    await mathCommand(mockSock, "test-chat-id", testCase.message);
    console.log(`   ✅ Command executed without errors`);
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
}

async function runAllTests() {
  for (const test of testMessages) {
    await runTest(test);
    // Add small delay between tests
    await new Promise((r) => setTimeout(r, 100));
  }
  console.log("\n=== All Command Tests Complete ===");
}

// Run tests
runAllTests().catch(console.error);
