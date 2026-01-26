/**
 * Centralized Bot State Management
 * Handles: lockdown, silence, ratelimit, failsafe
 * Persists across restarts via JSON storage
 */

const fs = require("fs");
const path = require("path");

const STATE_FILE = path.join(__dirname, "../data/botState.json");
const RATELIMIT_FILE = path.join(__dirname, "../data/ratelimitTracker.json");

// Ensure data directory exists
const dataDir = path.join(__dirname, "../data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Default state structure
const DEFAULT_STATE = {
  global: {
    enabled: true,
    disabledBy: null,
  },
  lockdown: {
    enabled: false,
    enabledAt: null,
    enabledBy: null,
  },
  silence: {
    enabled: false,
    expiresAt: null,
    enabledBy: null,
  },
  ratelimit: {
    enabled: false,
    limit: 5, // max commands
    windowMs: 60000, // 1 minute
    exemptAdmins: true,
  },
  failsafe: {
    crashCount: 0,
    lastCrashAt: null,
    threshold: 3,
    windowMs: 300000, // 5 minutes
    triggered: false,
  },
};

// In-memory state
let state = { ...DEFAULT_STATE };
let ratelimitTracker = {}; // { jid: [timestamp, timestamp, ...] }

/**
 * Load state from disk
 */
function loadState() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      const data = JSON.parse(fs.readFileSync(STATE_FILE, "utf-8"));
      state = { ...DEFAULT_STATE, ...data };

      // Check if silence has expired
      if (state.silence.enabled && state.silence.expiresAt) {
        if (Date.now() > state.silence.expiresAt) {
          state.silence.enabled = false;
          state.silence.expiresAt = null;
          saveState();
        }
      }
    }
  } catch (e) {
    console.error("Failed to load bot state:", e.message);
    state = { ...DEFAULT_STATE };
  }

  // Load ratelimit tracker
  try {
    if (fs.existsSync(RATELIMIT_FILE)) {
      ratelimitTracker = JSON.parse(fs.readFileSync(RATELIMIT_FILE, "utf-8"));
    }
  } catch (e) {
    ratelimitTracker = {};
  }
}

/**
 * Save state to disk
 */
function saveState() {
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
  } catch (e) {
    console.error("Failed to save bot state:", e.message);
  }
}

/**
 * Save ratelimit tracker (less frequently)
 */
function saveRatelimitTracker() {
  try {
    fs.writeFileSync(RATELIMIT_FILE, JSON.stringify(ratelimitTracker, null, 2));
  } catch (e) {
    console.error("Failed to save ratelimit tracker:", e.message);
  }
}

// =====================
// LOCKDOWN
// =====================
function isLockdownEnabled() {
  return state.lockdown.enabled;
}

function setLockdown(enabled, enabledBy = null) {
  state.lockdown.enabled = enabled;
  state.lockdown.enabledAt = enabled ? Date.now() : null;
  state.lockdown.enabledBy = enabledBy;
  saveState();
}

function getLockdownInfo() {
  return { ...state.lockdown };
}

// =====================
// SILENCE
// =====================
function isSilenceEnabled() {
  if (!state.silence.enabled) return false;

  // Check expiration
  if (state.silence.expiresAt && Date.now() > state.silence.expiresAt) {
    state.silence.enabled = false;
    state.silence.expiresAt = null;
    saveState();
    return false;
  }
  return true;
}

function setSilence(durationMs, enabledBy = null) {
  state.silence.enabled = true;
  state.silence.expiresAt = Date.now() + durationMs;
  state.silence.enabledBy = enabledBy;
  saveState();
}

function clearSilence() {
  state.silence.enabled = false;
  state.silence.expiresAt = null;
  saveState();
}

function getSilenceInfo() {
  return {
    enabled: isSilenceEnabled(),
    expiresAt: state.silence.expiresAt,
    remainingMs: state.silence.expiresAt
      ? Math.max(0, state.silence.expiresAt - Date.now())
      : 0,
  };
}

// =====================
// RATELIMIT
// =====================
function isRatelimitEnabled() {
  return state.ratelimit.enabled;
}

function setRatelimit(limit, windowMs, exemptAdmins = true) {
  state.ratelimit.enabled = true;
  state.ratelimit.limit = limit;
  state.ratelimit.windowMs = windowMs;
  state.ratelimit.exemptAdmins = exemptAdmins;
  saveState();
}

function disableRatelimit() {
  state.ratelimit.enabled = false;
  saveState();
}

function getRatelimitConfig() {
  return { ...state.ratelimit };
}

/**
 * Check if user is rate limited
 * @returns {boolean} true if user should be blocked
 */
function checkRatelimit(jid) {
  if (!state.ratelimit.enabled) return false;

  const now = Date.now();
  const windowStart = now - state.ratelimit.windowMs;

  // Initialize or clean old entries
  if (!ratelimitTracker[jid]) {
    ratelimitTracker[jid] = [];
  }

  // Remove old timestamps
  ratelimitTracker[jid] = ratelimitTracker[jid].filter(
    (ts) => ts > windowStart,
  );

  // Check if over limit
  if (ratelimitTracker[jid].length >= state.ratelimit.limit) {
    return true; // Rate limited
  }

  // Record this usage
  ratelimitTracker[jid].push(now);

  // Save periodically (not on every call for performance)
  if (Math.random() < 0.1) saveRatelimitTracker();

  return false;
}

function getRatelimitUsage(jid) {
  const now = Date.now();
  const windowStart = now - state.ratelimit.windowMs;
  const usage = (ratelimitTracker[jid] || []).filter((ts) => ts > windowStart);
  return { used: usage.length, limit: state.ratelimit.limit };
}

// =====================
// FAILSAFE
// =====================
function recordCrash() {
  const now = Date.now();
  const windowStart = now - state.failsafe.windowMs;

  // Reset if outside window
  if (state.failsafe.lastCrashAt && state.failsafe.lastCrashAt < windowStart) {
    state.failsafe.crashCount = 0;
  }

  state.failsafe.crashCount++;
  state.failsafe.lastCrashAt = now;

  // Check threshold
  if (state.failsafe.crashCount >= state.failsafe.threshold) {
    state.failsafe.triggered = true;
  }

  saveState();
  return state.failsafe.triggered;
}

function isFailsafeTriggered() {
  return state.failsafe.triggered;
}

function resetFailsafe() {
  state.failsafe.crashCount = 0;
  state.failsafe.lastCrashAt = null;
  state.failsafe.triggered = false;
  saveState();
}

function getFailsafeInfo() {
  return { ...state.failsafe };
}

// =====================
// LEGACY: PER-CHAT BOT DISABLE (Backward Compatibility)
// =====================
const DISABLED_CHATS_FILE = path.join(__dirname, "../data/disabledChats.json");
let disabledChats = [];

// Load disabled chats
try {
  if (fs.existsSync(DISABLED_CHATS_FILE)) {
    disabledChats = JSON.parse(fs.readFileSync(DISABLED_CHATS_FILE, "utf-8"));
  }
} catch (e) {
  disabledChats = [];
}

function saveDisabledChats() {
  try {
    fs.writeFileSync(
      DISABLED_CHATS_FILE,
      JSON.stringify(disabledChats, null, 2),
    );
  } catch (e) {
    console.error("Failed to save disabled chats:", e.message);
  }
}

function disableBot(chatId) {
  if (!disabledChats.includes(chatId)) {
    disabledChats.push(chatId);
    saveDisabledChats();
  }
}

function enableBot(chatId) {
  disabledChats = disabledChats.filter((id) => id !== chatId);
  saveDisabledChats();
}

function isBotDisabled(chatId) {
  return disabledChats.includes(chatId);
}

// Initialize on load
loadState();

module.exports = {
  // Lockdown
  isLockdownEnabled,
  setLockdown,
  getLockdownInfo,
  // Silence
  isSilenceEnabled,
  setSilence,
  clearSilence,
  getSilenceInfo,
  // Ratelimit
  isRatelimitEnabled,
  setRatelimit,
  disableRatelimit,
  getRatelimitConfig,
  checkRatelimit,
  getRatelimitUsage,
  // Failsafe
  recordCrash,
  isFailsafeTriggered,
  resetFailsafe,
  getFailsafeInfo,
  // Legacy Bot Control
  disableBot,
  enableBot,
  isBotDisabled,
  // Utilities
  loadState,
  saveState,
};
