const LetterLeapGame = require("../lib/letterLeapGame");
const { sendText } = require("../lib/sendResponse");
const { sendReaction } = require("../lib/reactions");

// Global Game Manager
const games = new Map(); // chatId -> GameInstance

async function letterLeapCommand(sock, chatId, message, args, senderId) {
  const subCmd = args[0] ? args[0].toLowerCase() : "";
  const game = games.get(chatId);

  // 1. HELP / INSTRUCTIONS
  if (!subCmd || subCmd === "help") {
    return await sendText(
      sock,
      chatId,
      `📜 *How to Play LetterLeap*

➤ *Start:* \`.leap start\`
➤ *Play:* \`.leap <word>\`
➤ *End:* \`.leap end\`

*Rules:*
1. Words must be 2+ letters & valid English.
2. Must start with the last letter of previous word.
3. No repeating words.
4. Beat the 180s timer!

 practice online: https://letter-leap.onrender.com`,
    );
  }

  // 2. START / JOIN
  if (subCmd === "start") {
    // Check if player is already in a game in THIS chat?
    // Or globally? Ideally globally, but simpler per chat for now.
    // Spec says "validating duplicate games per player".
    // I'll check if sender is in ANY game in this chat.

    if (game && game.status === "PLAYING") {
      if (game.playerA === senderId || game.playerB === senderId) {
        return await sendText(
          sock,
          chatId,
          "❌ You are already in a game. Type '.leap end' to quit.",
        );
      }
      return await sendText(
        sock,
        chatId,
        "⚠️ A game is already in progress in this chat.",
      );
    }

    if (game && game.status === "WAITING") {
      if (game.playerA === senderId) {
        return await sendText(
          sock,
          chatId,
          "⏳ You are already waiting for an opponent.",
        );
      }
      // Join
      const success = game.join(senderId);
      if (success) {
        // Game started inside Class logic
      } else {
        await sendText(sock, chatId, "❌ Failed to join game.");
      }
      return;
    }

    // Create new game
    const newGame = new LetterLeapGame(sock, chatId, senderId);
    games.set(chatId, newGame);
    await sendText(
      sock,
      chatId,
      "⏳ Waiting for opponent... Type '.leap start' to join.\n\nGet more experience on https://letter-leap.onrender.com",
    );
    return;
  }

  // 3. END / SURRENDER
  if (["end", "quit", "surrender", "exit"].includes(subCmd)) {
    if (!game || game.status === "ENDED") {
      return await sendText(sock, chatId, "❌ No active game to end.");
    }
    if (game.playerA !== senderId && game.playerB !== senderId) {
      return await sendText(sock, chatId, "❌ You are not in this game.");
    }
    await game.endGame("SURRENDER", senderId);
    games.delete(chatId);
    return;
  }

  // 4. PLAY WORD
  if (game && game.status === "PLAYING") {
    // If user typed .leap word, 'word' is subCmd.
    const word = subCmd;

    // Check if user is player
    if (game.playerA !== senderId && game.playerB !== senderId) {
      // Ignore non-players
      return;
    }

    const result = await game.playTurn(senderId, word);
    if (result === true) {
      await sendReaction(sock, message, "✅");
    } else {
      await sendReaction(sock, message, "❌");
      await sendText(sock, chatId, result, { quoted: message });
    }

    // Cleanup if ended (timeout handled in class, but we need to sync map)
    if (game.status === "ENDED") {
      games.delete(chatId);
    }
    return;
  }

  // Fallback
  await sendText(
    sock,
    chatId,
    "❌ No game active. Type `.leap start` to begin.",
  );
}

module.exports = { letterLeapCommand };
