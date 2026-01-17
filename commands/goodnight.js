const { sendText } = require("../lib/sendResponse");

const messages = [
  "Sleep well and have sweet dreams! Goodnight! 🌙✨",
  "May your dreams be as sweet as you are. Goodnight! 😴❤️",
  "Stars are shining bright, just like you. Have a peaceful night! 🌟",
  "Thinking of you and wishing you a restful sleep. Goodnight! 💤",
  "The day is over, it's time to rest. Sleep tight and wake up refreshed! 🌙",
  "As you close your eyes, may you find peace and comfort. Goodnight! ✨",
  "See you in the morning! Goodnight and take care. 🌙",
  "May the moon watch over you and keep you safe through the night. 🌕",
  "Sending you hugs and kisses for a lovely sleep. Goodnight! 😘🌙",
  "Tomorrow is a new day with new possibilities. Sleep well! ✨",
];

async function goodnightCommand(sock, chatId) {
  try {
    const goodnightMessage =
      messages[Math.floor(Math.random() * messages.length)];
    await sendText(sock, chatId, goodnightMessage);
  } catch (error) {
    console.error("Error in goodnight command:", error);
    await sendText(
      sock,
      chatId,
      "❌ Failed to get goodnight message. Please try again later!",
    );
  }
}

module.exports = { goodnightCommand };
