/**
 * Audit Log System
 * Tracks critical bot actions for transparency and debugging
 * Uses rotating JSON storage with automatic trimming
 */

const fs = require("fs");
const path = require("path");

const AUDIT_FILE = path.join(__dirname, "../data/auditLog.json");
const MAX_ENTRIES = 500; // Keep last 500 entries

// Ensure data directory exists
const dataDir = path.join(__dirname, "../data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// In-memory log
let auditLog = [];

/**
 * Load audit log from disk
 */
function loadAuditLog() {
  try {
    if (fs.existsSync(AUDIT_FILE)) {
      auditLog = JSON.parse(fs.readFileSync(AUDIT_FILE, "utf-8"));
    }
  } catch (e) {
    console.error("Failed to load audit log:", e.message);
    auditLog = [];
  }
}

/**
 * Save audit log to disk (with rotation)
 */
function saveAuditLog() {
  try {
    // Trim to max entries
    if (auditLog.length > MAX_ENTRIES) {
      auditLog = auditLog.slice(-MAX_ENTRIES);
    }
    fs.writeFileSync(AUDIT_FILE, JSON.stringify(auditLog, null, 2));
  } catch (e) {
    console.error("Failed to save audit log:", e.message);
  }
}

/**
 * Log an action
 * @param {string} action - The action name (e.g., "MODE_CHANGE", "PREFIX_CHANGE")
 * @param {string} executor - JID or LID of who performed the action
 * @param {string} context - "group" or "private"
 * @param {object} details - Additional details about the action
 */
function logAction(action, executor, context, details = {}) {
  const entry = {
    timestamp: new Date().toISOString(),
    action,
    executor,
    context,
    details,
  };

  auditLog.push(entry);
  saveAuditLog();

  // Also log to console for real-time monitoring
  console.log(`[AUDIT] ${action} by ${executor} in ${context}`, details);
}

/**
 * Get recent log entries
 * @param {number} count - Number of entries to retrieve
 * @returns {Array} Recent log entries (newest first)
 */
function getRecentLogs(count = 5) {
  return auditLog.slice(-count).reverse();
}

/**
 * Get logs by action type
 * @param {string} action - Action type to filter
 * @param {number} count - Max entries
 */
function getLogsByAction(action, count = 10) {
  return auditLog
    .filter((e) => e.action === action)
    .slice(-count)
    .reverse();
}

/**
 * Get logs by executor
 * @param {string} executor - JID to filter
 * @param {number} count - Max entries
 */
function getLogsByExecutor(executor, count = 10) {
  return auditLog
    .filter((e) => e.executor === executor)
    .slice(-count)
    .reverse();
}

/**
 * Clear all logs (owner only)
 */
function clearLogs() {
  auditLog = [];
  saveAuditLog();
}

/**
 * Get log statistics
 */
function getLogStats() {
  const actionCounts = {};
  auditLog.forEach((e) => {
    actionCounts[e.action] = (actionCounts[e.action] || 0) + 1;
  });

  return {
    totalEntries: auditLog.length,
    actionCounts,
    oldestEntry: auditLog[0]?.timestamp || null,
    newestEntry: auditLog[auditLog.length - 1]?.timestamp || null,
  };
}

// Predefined action types
const ACTIONS = {
  MODE_CHANGE: "MODE_CHANGE",
  PREFIX_CHANGE: "PREFIX_CHANGE",
  LOCKDOWN_TOGGLE: "LOCKDOWN_TOGGLE",
  SILENCE_TOGGLE: "SILENCE_TOGGLE",
  RATELIMIT_CHANGE: "RATELIMIT_CHANGE",
  FAILSAFE_RESET: "FAILSAFE_RESET",
  BOT_RESTART: "BOT_RESTART",
  ADMIN_COMMAND: "ADMIN_COMMAND",
  OWNER_COMMAND: "OWNER_COMMAND",
  BAN_USER: "BAN_USER",
  UNBAN_USER: "UNBAN_USER",
  GROUP_JOIN: "GROUP_JOIN",
  GROUP_LEAVE: "GROUP_LEAVE",
};

// Initialize on load
loadAuditLog();

module.exports = {
  logAction,
  getRecentLogs,
  getLogsByAction,
  getLogsByExecutor,
  clearLogs,
  getLogStats,
  ACTIONS,
};
