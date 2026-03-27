const { getDefaultConfig } = require('expo/metro-config');

// Expo SDK 52+ handles monorepo resolution automatically.
// Keeping the config minimal avoids Metro resolver version mismatches
// and duplicate workspace scans on Windows.
module.exports = getDefaultConfig(__dirname);
