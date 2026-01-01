async function githubCommand(sock, chatId) {
  const repoInfo = `*🤖SAMKIEL BOT*

*📂 GitHub Repository:*
https://github.com/samkiel488/SAMKIEL-AI 

_Star ⭐ the repository if you like the bot!_`;

  try {
    await sock.sendMessage(chatId, {
      text: repoInfo,
      ...global.channelInfo,
    });
  } catch (error) {
    console.error("Error in github command:", error);
    await sock.sendMessage(chatId, {
      text: "❌ Error fetching repository information.",
    });
  }
}

module.exports = githubCommand;
