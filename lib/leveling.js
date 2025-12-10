const fs = require("fs");
const path = "./data/leveling.json";

// Ensure data file exists
if (!fs.existsSync(path)) {
  fs.writeFileSync(path, JSON.stringify({}));
}

function loadData() {
  try {
    return JSON.parse(fs.readFileSync(path));
  } catch (e) {
    return {};
  }
}

function saveData(data) {
  fs.writeFileSync(path, JSON.stringify(data, null, 2));
}

function getLevel(xp) {
  // Formula: Level = Sqrt(XP / 10)
  // XP 0 => Lvl 0
  // XP 10 => Lvl 1
  // XP 40 => Lvl 2
  // XP 90 => Lvl 3
  // XP 1000 => Lvl 10
  return Math.floor(Math.sqrt(xp / 10));
}

function addXp(userId) {
  const data = loadData();
  if (!data[userId]) {
    data[userId] = { xp: 0, level: 0 };
  }

  // Add random XP between 1 and 5
  const xpGain = Math.floor(Math.random() * 5) + 1;
  data[userId].xp += xpGain;

  const newLevel = getLevel(data[userId].xp);
  const oldLevel = data[userId].level;
  let levelUp = false;

  if (newLevel > oldLevel) {
    data[userId].level = newLevel;
    levelUp = true;
  }

  saveData(data);
  return { levelUp, level: newLevel, xp: data[userId].xp };
}

function getUserRank(userId) {
  const data = loadData();
  const user = data[userId] || { xp: 0, level: 0 };

  // Calculate rank position
  const sorted = Object.entries(data).sort(([, a], [, b]) => b.xp - a.xp);
  const rank = sorted.findIndex(([id]) => id === userId) + 1;

  // Calculate XP needed for next level
  // NextLevel = CurrentLevel + 1
  // XP = Level * Level * 10
  const nextLevel = user.level + 1;
  const xpNeeded = nextLevel * nextLevel * 10 - user.xp;

  return {
    level: user.level,
    xp: user.xp,
    rank: rank || sorted.length + 1, // If not found (new user), imaginary last place
    xpNeeded,
  };
}

function getLeaderboard(limit = 10) {
  const data = loadData();
  return Object.entries(data)
    .sort(([, a], [, b]) => b.xp - a.xp)
    .slice(0, limit)
    .map(([userId, stats]) => ({ userId, ...stats }));
}

module.exports = { addXp, getUserRank, getLeaderboard };
