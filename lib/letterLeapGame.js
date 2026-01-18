const axios = require("axios");
const { sendText } = require("./sendResponse");

class LetterLeapGame {
  constructor(sock, chatId, playerA) {
    this.sock = sock;
    this.chatId = chatId;
    this.playerA = playerA;
    this.playerB = null;
    this.words = [];
    this.usedWords = new Set();
    this.playerWordCounts = { [playerA]: 0 };
    this.lastWord = "";
    this.currentTurn = false; // false = A, true = B
    this.status = "WAITING"; // WAITING, PLAYING, ENDED
    this.minWordLength = 2;
    this.timer = null;
    this.timeLeft = 180;
    this.timerInterval = null;
  }

  join(playerB) {
    if (this.status !== "WAITING") return false;
    if (this.playerA === playerB) return false;
    this.playerB = playerB;
    this.playerWordCounts[playerB] = 0;
    this.status = "PLAYING";
    this.startTimer();
    return true;
  }

  async startTimer() {
    await sendText(
      this.sock,
      this.chatId,
      `🔠 *Letter Leap Started!* @${this.playerA.split("@")[0]} vs @${this.playerB.split("@")[0]}\n\n⏱️ Game timer started: 180s\n\n📜 *Rules:*\n1. First word can be anything.\n2. Next word must start with last letter of previous.\n3. Min length: ${this.minWordLength}\n4. No repeats.\n\nPlayer A starts!`,
      { mentions: [this.playerA, this.playerB] },
    );

    this.timerInterval = setInterval(() => {
      this.timeLeft--;

      if (this.timeLeft === 120) this.sendNotification("2 minutes left ⏳");
      if (this.timeLeft === 60) this.sendNotification("1 minute left ⚡");
      if (this.timeLeft === 30) this.sendNotification("Final 30 seconds! 🚀");
      if (this.timeLeft <= 10 && this.timeLeft > 0)
        this.sendNotification(`${this.timeLeft}...`);

      if (this.timeLeft <= 0) {
        this.endGame("TIMEOUT");
      }
    }, 1000);
  }

  async sendNotification(text) {
    await sendText(this.sock, this.chatId, `⏱️ ${text}`);
  }

  async playTurn(player, word) {
    if (this.status !== "PLAYING")
      return "⏹️ This game has ended and is no longer accepting moves.";

    // Check turn
    const currentPlayer = this.currentTurn ? this.playerB : this.playerA;
    if (player !== currentPlayer) return "⛔ Not your turn!";

    word = word.toLowerCase().trim();

    // Validation
    // 1. Regex (Letters only, length)
    if (!/^[a-zA-Z]+$/.test(word))
      return "❌ Word must contain only letters (A–Z).";
    if (word.length < this.minWordLength)
      return `📏 Word is too short. Minimum length is ${this.minWordLength}`;

    // 2. Repeats
    if (this.usedWords.has(word)) return "🔁 Word has already been used.";

    // 3. Chain Rule
    if (this.lastWord) {
      const requiredChar = this.lastWord.slice(-1);
      if (word[0] !== requiredChar)
        return `🔗 Word must start with '${requiredChar.toUpperCase()}'`;
    }

    // 4. Dictionary Check
    try {
      await axios.get(
        `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`,
      );
    } catch (e) {
      return `📚 '${word}' not found in dictionary.`;
    }

    // Process Valid Move
    this.words.push(word);
    this.usedWords.add(word);
    this.lastWord = word;
    this.playerWordCounts[player]++;

    // Increase difficulty?
    // Formula: newMin = Math.min(6, 2 + Math.floor(playerWordCount / 2))
    const newMin = Math.min(
      6,
      2 + Math.floor(this.playerWordCounts[player] / 2),
    );
    if (newMin > this.minWordLength) {
      this.minWordLength = newMin;
      await sendText(
        this.sock,
        this.chatId,
        `🚨 *MIN WORD LENGTH INCREASED!* Now you must use words with at least ${this.minWordLength} letters!`,
      );
    }

    // Switch Turn
    this.currentTurn = !this.currentTurn;
    const nextPlayer = this.currentTurn ? this.playerB : this.playerA;
    const required = word.slice(-1).toUpperCase();

    // Send Success Logic
    // React to user message? (Handled in command file ideally, but we can return status)

    // Status Display
    const statusMsg = `✅ *Valid!* \n\n➡️ Last Word: *${word.toUpperCase()}*\n🔠 Next Letter: *${required}*\n👤 Turn: @${nextPlayer.split("@")[0]}\n📏 Min Length: ${this.minWordLength}\n\nHistory: ${this.words.slice(-5).join(" ➡️ ")}`;

    await sendText(this.sock, this.chatId, statusMsg, {
      mentions: [nextPlayer],
    });

    return true; // Success
  }

  async endGame(reason, surrenderPlayer = null) {
    if (this.status === "ENDED") return;
    this.status = "ENDED";
    clearInterval(this.timerInterval);

    let endMsg = "";
    if (reason === "TIMEOUT") {
      const scoreA = this.playerWordCounts[this.playerA];
      const scoreB = this.playerWordCounts[this.playerB];
      let winner = "Draw";
      if (scoreA > scoreB) winner = `@${this.playerA.split("@")[0]}`;
      if (scoreB > scoreA) winner = `@${this.playerB.split("@")[0]}`;

      endMsg = `⏳ *Time's up!*\n\n📊 *Final Score:*\n@${this.playerA.split("@")[0]}: ${scoreA}\n@${this.playerB.split("@")[0]}: ${scoreB}\n\n🏆 *Winner:* ${winner}`;
    } else if (reason === "SURRENDER") {
      const winner =
        surrenderPlayer === this.playerA ? this.playerB : this.playerA;
      endMsg = `🏳️ @${surrenderPlayer.split("@")[0]} surrendered!\n🏆 @${winner.split("@")[0]} wins the game!\n\nGet more experience on https://letter-leap.onrender.com`;
    }

    await sendText(this.sock, this.chatId, endMsg, {
      mentions: [this.playerA, this.playerB],
    });

    // Callback to manager to remove game will be handled by Manager checking status or explicit call
  }
}

module.exports = LetterLeapGame;
