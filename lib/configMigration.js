/**
 * Config Migration Helper
 * Ensures user configs are preserved during bot updates
 */

const fs = require("fs");
const path = require("path");

// List of config files that must be preserved during updates
const PERSISTENT_CONFIGS = [
  "data/owner.json",
  "data/mode.json",
  "data/prefix.json",
  "data/userGroupData.json",
  "data/voiceChat.json",
  "data/autoStatus.json",
  "data/antiDelete.json",
  "data/banned.json",
  "data/disabledBots.json",
  "data/botVoice.json",
  "data/warnings.json",
  "data/settings.json",
  "settings.js",
  ".env",
];

// List of data directories that must never be deleted
const PROTECTED_DIRS = ["data", "session", "temp"];

/**
 * Deep merge two objects, with target as base and source as overrides
 * This ensures new keys in defaults are added, while existing keys in source are kept
 */
function deepMerge(target, source) {
  if (!source || typeof source !== "object") return target;
  if (!target || typeof target !== "object") return source;

  const result = { ...target };

  for (const key of Object.keys(source)) {
    if (
      source[key] instanceof Object &&
      !Array.isArray(source[key]) &&
      key in result
    ) {
      result[key] = deepMerge(result[key], source[key]);
    } else {
      result[key] = source[key];
    }
  }

  return result;
}

/**
 * Explicitly save current in-memory settings to persistent JSON
 * This captures manual edits to settings.js and moves them to data/settings.json
 * so they survive a git reset/update.
 */
function persistSettings(settings) {
  try {
    const settingsPath = path.join(process.cwd(), "data/settings.json");
    const dir = path.dirname(settingsPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Filter out functions or non-serializable parts if any
    const cleanSettings = {};
    for (const [key, value] of Object.entries(settings)) {
      if (typeof value !== "function") {
        cleanSettings[key] = value;
      }
    }

    fs.writeFileSync(settingsPath, JSON.stringify(cleanSettings, null, 2));
    console.log("[Config] Current settings persisted to data/settings.json");
    return true;
  } catch (e) {
    console.error("[Config] Failed to persist settings:", e);
    return false;
  }
}

/**
 * Backup all persistent config files before update
 */
function backupConfigs(backupDir) {
  const timestamp = Date.now();
  const backupPath = path.join(
    process.cwd(),
    backupDir || "data/backups",
    `backup_${timestamp}`,
  );

  try {
    if (!fs.existsSync(backupPath)) {
      fs.mkdirSync(backupPath, { recursive: true });
    }

    for (const config of PERSISTENT_CONFIGS) {
      const sourcePath = path.join(process.cwd(), config);
      if (fs.existsSync(sourcePath)) {
        const destPath = path.join(backupPath, path.basename(config));
        fs.copyFileSync(sourcePath, destPath);
      }
    }

    console.log(`[Config] Backup created at: ${backupPath}`);
    return backupPath;
  } catch (e) {
    console.error("[Config] Backup failed:", e);
    return null;
  }
}

/**
 * Migrate JSON config file - merge new defaults without overwriting existing values
 */
function migrateJsonConfig(filePath, defaultValues) {
  try {
    const fullPath = path.join(process.cwd(), filePath);

    // Load existing config if it exists
    let existing = {};
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, "utf8").trim();
      if (content) {
        existing = JSON.parse(content);
      }
    }

    // Merge with defaults (existing values take priority)
    const merged = deepMerge(existing, defaultValues);

    // Ensure directory exists
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Write merged config
    fs.writeFileSync(fullPath, JSON.stringify(merged, null, 2));
    console.log(`[Config] Migrated: ${filePath}`);
    return merged;
  } catch (e) {
    console.error(`[Config] Migration failed for ${filePath}:`, e);
    return null;
  }
}

/**
 * Ensure all required config files exist with defaults
 */
function ensureConfigsExist() {
  const defaults = {
    "data/owner.json": {
      superOwner: [],
      owners: [],
    },
    "data/mode.json": {
      isPublic: true,
    },
    "data/prefix.json": {
      prefix: ".",
    },
    "data/userGroupData.json": {
      antibadword: {},
      antilink: {},
      welcome: {},
      goodbye: {},
      chatbot: {},
      warnings: {},
      sudo: [],
      users: [],
      groups: [],
      autoReaction: false,
    },
    "data/voiceChat.json": {
      enabled: false,
    },
    "data/autoStatus.json": {
      enabled: true,
    },
    "data/antiDelete.json": {
      enabled: true,
      type: "group",
    },
    "data/banned.json": {
      banned: [],
    },
    "data/disabledBots.json": {
      chats: [],
    },
    "data/warnings.json": {},
  };

  for (const [file, defaultValue] of Object.entries(defaults)) {
    const fullPath = path.join(process.cwd(), file);
    if (!fs.existsSync(fullPath)) {
      try {
        const dir = path.dirname(fullPath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(fullPath, JSON.stringify(defaultValue, null, 2));
        console.log(`[Config] Created default: ${file}`);
      } catch (e) {
        console.error(`[Config] Failed to create ${file}:`, e);
      }
    }
  }
}

/**
 * Run full config migration after update
 */
function runMigration() {
  console.log("[Config] Running post-update migration...");

  // Ensure data directory exists
  const dataDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // Ensure all configs exist with defaults
  ensureConfigsExist();

  console.log("[Config] Migration complete.");
}

module.exports = {
  PERSISTENT_CONFIGS,
  PROTECTED_DIRS,
  deepMerge,
  backupConfigs,
  migrateJsonConfig,
  persistSettings,
  ensureConfigsExist,
  runMigration,
};
