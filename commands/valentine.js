const { sendText } = require("../lib/sendResponse");

const messages = [
  "Happy Valentine's Day! ❤️ may your day be filled with love and joy!",
  "Sending you loads of love and hugs on this special day. Happy Valentine's Day! 💖",
  "Love is not just about finding the right person, but creating a right relationship. Happy Valentine's Day! 💘",
  "You make my heart smile. Happy Valentine's Day! ❤️",
  "To the world you may be one person, but to one person you may be the world. Happy Valentine's Day! 🌹",
  "May your life be filled with the sweetness of love. Happy Valentine's Day! 💕",
  "Wishing you a day full of romantic surprises! Happy Valentine's Day! 💝",
  "Love is the bridge between two hearts. Happy Valentine's Day! 🌉❤️",
  "Every moment with you is magic. Happy Valentine's Day! ✨",
  "You are the reason for my smile. Happy Valentine's Day! 😊❤️",
];

async function valentineCommand(sock, chatId) {
  try {
    const valentineMessage =
      messages[Math.floor(Math.random() * messages.length)];
    await sendText(sock, chatId, valentineMessage);
  } catch (error) {
    console.error("Error in valentine command:", error);
    await sendText(sock, chatId, "❌ Failed to get valentine quote.");
  }
}

module.exports = { valentineCommand };
