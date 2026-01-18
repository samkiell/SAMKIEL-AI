const axios = require("axios");
const { sendText } = require("../lib/sendResponse");

/**
 * Live Score Command (via ESPN API)
 * Fetches live soccer scores for major leagues.
 */
async function livescoreCommand(sock, chatId, args) {
  // League Mapping
  const leagues = {
    epl: "eng.1",
    premier: "eng.1",
    pl: "eng.1",
    laliga: "esp.1",
    bundesliga: "ger.1",
    seriea: "ita.1",
    ligue1: "fra.1",
    ucl: "uefa.champions",
    champions: "uefa.champions",
    europa: "uefa.europa",
    mls: "usa.1",
    eredivisie: "ned.1",
    portugal: "por.1",
    turkey: "tur.1",
    scotland: "sco.1",
    all: "all",
  };

  const query = args[0]?.toLowerCase();

  if (!query || query === "help") {
    return await sendText(
      sock,
      chatId,
      "⚽ *Live Score Usage*\n\n" +
        "Use `.score <league>` to see matches.\n\n" +
        "*Supported Leagues:*\n" +
        "• `epl` (Premier League)\n" +
        "• `laliga` (La Liga)\n" +
        "• `seriea` (Serie A)\n" +
        "• `bundesliga` (Germany)\n" +
        "• `ucl` (Champions League)\n" +
        "• `ligue1` (France)\n" +
        "• `mls` (USA)\n\n" +
        "*Example:* .score epl",
    );
  }

  const leagueCode = leagues[query];
  if (!leagueCode) {
    return await sendText(
      sock,
      chatId,
      "❌ Unknown league. Try `.score help` for list.",
    );
  }

  // Base URL
  const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/${leagueCode}/scoreboard`;

  try {
    const { data } = await axios.get(url, { timeout: 8000 });
    const events = data.events || [];
    const leagueName = data.leagues?.[0]?.name || query.toUpperCase();

    if (events.length === 0) {
      return await sendText(
        sock,
        chatId,
        `⚽ *${leagueName}*\n\n❌ No matches scheduled for today.`,
      );
    }

    let msg = `⚽ *${leagueName} Scores*\n━━━━━━━━━━━━━━━\n\n`;

    events.forEach((event) => {
      const competition = event.competitions[0];
      const status = event.status.type.shortDetail; // "FT", "HT", "90+2'", "15:00"

      const home = competition.competitors.find((c) => c.homeAway === "home");
      const away = competition.competitors.find((c) => c.homeAway === "away");

      // Format: [Home] 1 - 2 [Away]
      msg += `*${home.team.shortDisplayName}*  ${home.score} 🆚 ${away.score}  *${away.team.shortDisplayName}*\n`;
      msg += `└ 🕒 ${status}\n\n`;
    });

    msg += `_Data provided by ESPN_`;

    await sendText(sock, chatId, msg);
  } catch (e) {
    console.error("Livescore Error:", e.message);
    await sendText(
      sock,
      chatId,
      "❌ Failed to fetch live scores. API might be busy.",
    );
  }
}

module.exports = livescoreCommand;
