/**
 * Fact Command - Random interesting facts
 * Multiple fallback APIs for reliability
 * No branding, rate limited
 */

const axios = require("axios");
const { sendText } = require("../lib/sendResponse");

const TIMEOUT = 8000;

/**
 * API 1: API Ninjas Facts (Primary)
 */
async function getApiNinjasFact() {
  const url = "https://api.api-ninjas.com/v1/facts?limit=1";
  const { data } = await axios.get(url, {
    headers: { "X-Api-Key": "2tVLwYJZD3+0FuBrTnrOzA==TL7qWl3Xv1wOH48g" },
    timeout: TIMEOUT,
  });

  if (data && data[0]?.fact) {
    return data[0].fact;
  }
  throw new Error("No fact returned");
}

/**
 * API 2: Useless Facts (Fallback - No Key)
 */
async function getUselessFact() {
  const url = "https://uselessfacts.jsph.pl/random.json?language=en";
  const { data } = await axios.get(url, { timeout: TIMEOUT });

  if (data?.text) {
    return data.text;
  }
  throw new Error("No fact returned");
}

/**
 * API 3: Random Facts API (Fallback)
 */
async function getRandomFact() {
  const url = "https://api.fungenerators.com/fact/random";
  const { data } = await axios.get(url, { timeout: TIMEOUT });

  if (data?.contents?.fact) {
    return data.contents.fact;
  }
  throw new Error("No fact returned");
}

/**
 * API 4: Numbers API (Math/Trivia - Fallback)
 */
async function getNumbersFact() {
  const randomNum = Math.floor(Math.random() * 1000);
  const type = Math.random() > 0.5 ? "trivia" : "math";
  const url = `http://numbersapi.com/${randomNum}/${type}`;

  const { data } = await axios.get(url, { timeout: TIMEOUT });

  if (data && typeof data === "string" && data.length > 10) {
    return data;
  }
  throw new Error("No fact returned");
}

/**
 * API 5: Cat Facts (Fun Fallback)
 */
async function getCatFact() {
  const url = "https://catfact.ninja/fact";
  const { data } = await axios.get(url, { timeout: TIMEOUT });

  if (data?.fact) {
    return `🐱 Cat Fact: ${data.fact}`;
  }
  throw new Error("No fact returned");
}

/**
 * API 6: Dog Facts (Fun Fallback)
 */
async function getDogFact() {
  const url = "https://dog-api.kinduff.com/api/facts";
  const { data } = await axios.get(url, { timeout: TIMEOUT });

  if (data?.facts && data.facts[0]) {
    return `🐕 Dog Fact: ${data.facts[0]}`;
  }
  throw new Error("No fact returned");
}

/**
 * Nekos Life API (Original - Fallback)
 */
async function getNekosLifeFact() {
  const url = "https://nekos.life/api/v2/fact";
  const { data } = await axios.get(url, { timeout: TIMEOUT });

  if (data?.fact) {
    return data.fact;
  }
  throw new Error("No fact returned");
}

async function factCommand(sock, chatId, args) {
  const type = args[0]?.toLowerCase();

  let fact = null;

  // Handle specific types
  if (type === "cat") {
    try {
      fact = await getCatFact();
    } catch (e) {}
  } else if (type === "dog") {
    try {
      fact = await getDogFact();
    } catch (e) {}
  } else if (type === "number" || type === "math") {
    try {
      fact = await getNumbersFact();
    } catch (e) {}
  }

  // General fact chain
  if (!fact) {
    // Try API Ninjas
    try {
      fact = await getApiNinjasFact();
    } catch (e) {
      console.log("Fact: API Ninjas failed");
    }
  }

  if (!fact) {
    try {
      fact = await getUselessFact();
    } catch (e) {
      console.log("Fact: Useless Facts failed");
    }
  }

  if (!fact) {
    try {
      fact = await getNekosLifeFact();
    } catch (e) {
      console.log("Fact: Nekos Life failed");
    }
  }

  if (!fact) {
    try {
      fact = await getNumbersFact();
    } catch (e) {
      console.log("Fact: Numbers API failed");
    }
  }

  if (!fact) {
    try {
      fact = await getCatFact();
    } catch (e) {
      console.log("Fact: Cat Facts failed");
    }
  }

  if (!fact) {
    return await sendText(
      sock,
      chatId,
      "❌ Could not fetch a fact right now. Try again!",
    );
  }

  await sendText(
    sock,
    chatId,
    `💡 *Did you know?*\n\n${fact}\n\n*Powered by SAMKIEL BOT*`,
  );
}

// Command metadata
factCommand.meta = {
  name: "fact",
  aliases: ["facts", "trivia", "didyouknow"],
  ownerOnly: false,
  adminOnly: false,
  groupOnly: false,
  lockdownBlocked: true,
  ratelimited: true,
  silenceBlocked: true,
  description: "Get a random interesting fact",
};

module.exports = factCommand;
