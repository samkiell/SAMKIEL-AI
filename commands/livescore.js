/**
 * Live Score Command - Real-time football scores
 * Multiple fallback APIs for reliability
 * No branding, rate limited
 */

const axios = require("axios");
const { sendText } = require("../lib/sendResponse");

const TIMEOUT = 10000;

// League mapping for different APIs
const leagueMap = {
  // ESPN codes
  epl: { espn: "eng.1", api: "39", name: "Premier League" },
  premier: { espn: "eng.1", api: "39", name: "Premier League" },
  pl: { espn: "eng.1", api: "39", name: "Premier League" },
  laliga: { espn: "esp.1", api: "140", name: "La Liga" },
  bundesliga: { espn: "ger.1", api: "78", name: "Bundesliga" },
  seriea: { espn: "ita.1", api: "135", name: "Serie A" },
  ligue1: { espn: "fra.1", api: "61", name: "Ligue 1" },
  ucl: { espn: "uefa.champions", api: "2", name: "Champions League" },
  champions: { espn: "uefa.champions", api: "2", name: "Champions League" },
  europa: { espn: "uefa.europa", api: "3", name: "Europa League" },
  mls: { espn: "usa.1", api: "253", name: "MLS" },
  eredivisie: { espn: "ned.1", api: "88", name: "Eredivisie" },
  portugal: { espn: "por.1", api: "94", name: "Primeira Liga" },
  npfl: { espn: null, api: "332", name: "Nigeria Premier League" },
  afcon: { espn: null, api: "6", name: "Africa Cup of Nations" },
};

/**
 * API 1: ESPN (Primary - No Key Required)
 */
async function getESPNScores(leagueCode) {
  const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/${leagueCode}/scoreboard`;
  const { data } = await axios.get(url, { timeout: TIMEOUT });

  const events = data.events || [];
  const leagueName = data.leagues?.[0]?.name || "Football";

  if (events.length === 0) {
    return { leagueName, matches: [] };
  }

  const matches = events.map((event) => {
    const competition = event.competitions[0];
    const status = event.status.type.shortDetail;
    const home = competition.competitors.find((c) => c.homeAway === "home");
    const away = competition.competitors.find((c) => c.homeAway === "away");

    return {
      homeTeam: home.team.shortDisplayName,
      homeScore: home.score,
      awayTeam: away.team.shortDisplayName,
      awayScore: away.score,
      status: status,
      isLive: event.status.type.state === "in",
    };
  });

  return { leagueName, matches };
}

/**
 * API 2: Football-Data.org (Fallback - Free Tier)
 */
async function getFootballDataScores(leagueId) {
  const apiKey = "10e8f8c5a19a4c5dab853c8c8f0c6e8d"; // Free tier
  const url = `https://api.football-data.org/v4/competitions/${leagueId}/matches?status=SCHEDULED,LIVE,IN_PLAY,FINISHED&dateFrom=${getTodayDate()}&dateTo=${getTodayDate()}`;

  const { data } = await axios.get(url, {
    headers: { "X-Auth-Token": apiKey },
    timeout: TIMEOUT,
  });

  const matches = (data.matches || []).map((m) => ({
    homeTeam: m.homeTeam.shortName || m.homeTeam.name,
    homeScore: m.score.fullTime.home ?? "-",
    awayTeam: m.awayTeam.shortName || m.awayTeam.name,
    awayScore: m.score.fullTime.away ?? "-",
    status: formatStatus(m.status),
    isLive: m.status === "IN_PLAY" || m.status === "LIVE",
  }));

  return { leagueName: data.competition?.name || "Football", matches };
}

/**
 * API 3: ScoreBat (Fallback - Free, Video Highlights)
 */
async function getScoreBatScores() {
  const url = "https://www.scorebat.com/video-api/v3/";
  const { data } = await axios.get(url, { timeout: TIMEOUT });

  if (!data.response || data.response.length === 0) {
    return { leagueName: "Recent Matches", matches: [] };
  }

  // Get unique matches
  const seen = new Set();
  const matches = data.response
    .slice(0, 10)
    .filter((m) => {
      const key = `${m.side1?.name}-${m.side2?.name}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map((m) => ({
      homeTeam: m.side1?.name || "Team A",
      homeScore: "-",
      awayTeam: m.side2?.name || "Team B",
      awayScore: "-",
      status: "Highlights Available",
      isLive: false,
    }));

  return { leagueName: "Recent Matches", matches };
}

/**
 * Helper: Get today's date in YYYY-MM-DD format
 */
function getTodayDate() {
  return new Date().toISOString().split("T")[0];
}

/**
 * Helper: Format status
 */
function formatStatus(status) {
  const statusMap = {
    SCHEDULED: "Upcoming",
    TIMED: "Upcoming",
    IN_PLAY: "🔴 LIVE",
    LIVE: "🔴 LIVE",
    PAUSED: "HT",
    FINISHED: "FT",
    POSTPONED: "Postponed",
    CANCELLED: "Cancelled",
  };
  return statusMap[status] || status;
}

async function livescoreCommand(sock, chatId, args) {
  const query = args[0]?.toLowerCase();

  // Show help if no query
  if (!query || query === "help") {
    return await sendText(
      sock,
      chatId,
      "⚽ *Live Score*\n\n" +
        "*Usage:* score <league>\n\n" +
        "*Leagues:*\n" +
        "├ `epl` - Premier League\n" +
        "├ `laliga` - La Liga\n" +
        "├ `seriea` - Serie A\n" +
        "├ `bundesliga` - Bundesliga\n" +
        "├ `ucl` - Champions League\n" +
        "├ `ligue1` - Ligue 1\n" +
        "├ `europa` - Europa League\n" +
        "└ `mls` - MLS\n\n" +
        "*Example:* .score epl",
    );
  }

  const league = leagueMap[query];
  if (!league) {
    return await sendText(
      sock,
      chatId,
      "❌ Unknown league. Use `.score help` for the list.",
    );
  }

  let result = null;
  let apiUsed = "";

  // Try ESPN first
  if (league.espn) {
    try {
      result = await getESPNScores(league.espn);
      apiUsed = "ESPN";
    } catch (e) {
      console.log("LiveScore: ESPN failed, trying Football-Data...");
    }
  }

  // Try Football-Data.org
  if (!result || result.matches.length === 0) {
    try {
      // Map league ID for Football-Data
      const fdLeagueMap = {
        39: "PL",
        140: "PD",
        78: "BL1",
        135: "SA",
        61: "FL1",
        2: "CL",
      };
      const fdCode = fdLeagueMap[league.api] || league.api;
      result = await getFootballDataScores(fdCode);
      apiUsed = "Football-Data";
    } catch (e) {
      console.log("LiveScore: Football-Data failed, trying ScoreBat...");
    }
  }

  // Try ScoreBat as last resort
  if (!result || result.matches.length === 0) {
    try {
      result = await getScoreBatScores();
      apiUsed = "ScoreBat";
    } catch (e) {
      console.log("LiveScore: All APIs failed");
    }
  }

  if (!result || result.matches.length === 0) {
    return await sendText(
      sock,
      chatId,
      `⚽ *${league.name}*\n\n❌ No matches found for today.`,
    );
  }

  // Build response
  let msg = `⚽ *${result.leagueName || league.name} Scores*\n━━━━━━━━━━━━━━━\n\n`;

  result.matches.forEach((match) => {
    const liveIcon = match.isLive ? "🔴 " : "";
    msg += `${liveIcon}*${match.homeTeam}*  ${match.homeScore} 🆚 ${match.awayScore}  *${match.awayTeam}*\n`;
    msg += `└ 🕒 ${match.status}\n\n`;
  });

  msg += `*Powered by SAMKIEL BOT*`;
  await sendText(sock, chatId, msg.trim());
}

// Command metadata
livescoreCommand.meta = {
  name: "livescore",
  aliases: ["score", "scores", "football", "soccer"],
  ownerOnly: false,
  adminOnly: false,
  groupOnly: false,
  lockdownBlocked: true,
  ratelimited: true,
  silenceBlocked: true,
  description: "Get live football scores",
};

module.exports = livescoreCommand;
