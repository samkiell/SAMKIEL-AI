const { sendText } = require("../lib/sendResponse");

const messages = [
  "Wishing you a day as beautiful and fragrant as a rose! Happy Rose Day! 🌹",
  "A rose for the most beautiful rose I know. Happy Rose Day! 🌹",
  "Beauty is found within, but a rose is a great way to start. Happy Rose Day! 🌹",
  "May your life be filled with the sweetness of roses and the warmth of love. Happy Rose Day! 🌹",
  "Roses are red, violets are blue, I'm so lucky to have a friend like you! Happy Rose Day! 🌹",
  "Sending you an abundance of roses to brighten your day and fill your heart with joy. Happy Rose Day! 🌹",
  "Every petal of this rose whispers how much I care for you. Happy Rose Day! 🌹",
  "A single rose can be my garden... a single friend, my world. Happy Rose Day! 🌹",
  "May the fragrance of this rose spread happiness and love in your life today and always. 🌹",
  "Happy Rose Day to someone who is as special and lovely as a rose in full bloom. 🌹",
];

async function rosedayCommand(sock, chatId) {
  try {
    const rosedayMessage =
      messages[Math.floor(Math.random() * messages.length)];
    await sendText(sock, chatId, rosedayMessage);
  } catch (error) {
    console.error("Error in roseday command:", error);
    await sendText(
      sock,
      chatId,
      "❌ Failed to get roseday quote. Please try again later!",
    );
  }
}

module.exports = { rosedayCommand };
