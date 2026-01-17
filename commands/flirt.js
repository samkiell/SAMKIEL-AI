const { sendText } = require("../lib/sendResponse");

const lines = [
  "Are you a magician? Because whenever I look at you, everyone else disappears.",
  "Do you have a map? because I just got lost in your eyes.",
  "I'm not a photographer, but I can definitely picture us together.",
  "Do you believe in love at first sight, or should I walk by again?",
  "Are you a Wi-Fi signal? Because I'm feeling a really strong connection.",
  "If you were a vegetable, you'd be a 'cute-cumber.'",
  "Is your name Google? Because you have everything I've been searching for.",
  "Are you a parking ticket? Because you've got 'FINE' written all over you.",
  "I was going to say something sweet, but then I saw you and became speechless.",
  "Your hand looks heavy—can I hold it for you?",
];

async function flirtCommand(sock, chatId) {
  try {
    const flirtMessage = lines[Math.floor(Math.random() * lines.length)];
    await sendText(sock, chatId, `💕 *Flirt:* ${flirtMessage}`);
  } catch (error) {
    console.error("Error in flirt command:", error);
    await sendText(
      sock,
      chatId,
      "❌ Failed to get flirt message. Please try again later!",
    );
  }
}

module.exports = { flirtCommand };
