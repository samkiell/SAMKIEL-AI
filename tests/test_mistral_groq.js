const axios = require("axios");
const settings = require("../settings");

const TIMEOUT = 15000;
const TEST_QUERY = "Hello, who are you and what can you do?";

async function testMistralAgent() {
  console.log("\n--- Testing Mistral AI Agent ---");
  const apiKey = settings.mistralApiKey;
  const agentId = settings.mistralAgentId;

  if (!apiKey || !agentId) {
    console.log("❌ Mistral: Credentials missing in settings.js");
    return;
  }

  try {
    const response = await axios.post(
      "https://api.mistral.ai/v1/conversations",
      {
        agent_id: agentId,
        inputs: [{ role: "user", content: TEST_QUERY }],
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        timeout: TIMEOUT,
      },
    );

    const answer =
      response.data?.outputs?.[0]?.content ||
      response.data?.message?.content ||
      response.data?.choices?.[0]?.message?.content ||
      response.data?.content;

    if (answer) {
      console.log("✅ Mistral Agent Succeeded!");
      console.log("Response snippet:", answer.substring(0, 100) + "...");
    } else {
      console.log("❌ Mistral Agent: No content in response");
      console.log("Full response data:", JSON.stringify(response.data));
    }
  } catch (e) {
    console.log("❌ Mistral Agent Failed:", e.message);
    if (e.response?.data) {
      console.log("Error details:", JSON.stringify(e.response.data));
    }
  }
}

async function testGroqBackup() {
  console.log("\n--- Testing Groq AI Backup ---");
  const apiKey = settings.groqApiKey;

  if (!apiKey) {
    console.log("❌ Groq: No API key in settings.js");
    return;
  }

  try {
    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: TEST_QUERY }],
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        timeout: TIMEOUT,
      },
    );

    const answer = response.data?.choices?.[0]?.message?.content;
    if (answer) {
      console.log("✅ Groq Succeeded!");
      console.log("Response snippet:", answer.substring(0, 100) + "...");
    } else {
      console.log("❌ Groq: No content in response");
    }
  } catch (e) {
    console.log("❌ Groq Failed:", e.message);
  }
}

async function runTests() {
  console.log("🚀 Starting AI API Tests...");
  await testMistralAgent();
  await testGroqBackup();
  console.log("\n🏁 Tests Completed.");
}

runTests();
