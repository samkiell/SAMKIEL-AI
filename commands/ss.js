const fetch = require("node-fetch");
const { loadPrefix } = require("../lib/prefix");

async function handleSsCommand(sock, chatId, message, match) {
  const currentPrefix = loadPrefix();
  const p = currentPrefix === "off" ? "" : currentPrefix;

  if (!match) {
    await sock.sendMessage(
      chatId,
      {
        text: `*SCREENSHOT TOOL*\n\n*${p}ss <url>*\n*${p}ssweb <url>*\n*${p}screenshot <url>*\n\nTake a screenshot of any website\n\nExample:\n${p}ss https://google.com\n${p}ssweb https://google.com\n${p}screenshot https://google.com`,
        ...global.channelInfo,
      },
      {
        quoted: message,
      }
    );
    return;
  }

  try {
    // Show typing indicator
    await sock.presenceSubscribe(chatId);
    await sock.sendPresenceUpdate("composing", chatId);

    // Extract URL from command
    const url = match.trim();

    // Validate URL
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      return sock.sendMessage(
        chatId,
        {
          text: "❌ Please provide a valid URL starting with http:// or https://",
          ...global.channelInfo,
        },
        {
          quoted: message,
        }
      );
    }

    // Call the API (using screenshotlayer demo - has watermark but works)
    const response = await fetch(
      `https://api.screenshotlayer.com/api/capture?access_key=demo&url=${encodeURIComponent(
        url
      )}&viewport=1440x900&format=PNG&quality=100`
    );

    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }

    // Get the image buffer
    const imageBuffer = await response.buffer();

    // Send the screenshot
    await sock.sendMessage(
      chatId,
      {
        image: imageBuffer,
        ...global.channelInfo,
      },
      {
        quoted: message,
      }
    );
  } catch (error) {
    console.error("❌ Error in ss command:", error);
    await sock.sendMessage(
      chatId,
      {
        text: "❌ Failed to take screenshot. Please try again in a few minutes.\n\nPossible reasons:\n• Invalid URL\n• Website is blocking screenshots\n• Website is down\n• API service is temporarily unavailable",
        ...global.channelInfo,
      },
      {
        quoted: message,
      }
    );
  }
}

module.exports = {
  handleSsCommand,
};
