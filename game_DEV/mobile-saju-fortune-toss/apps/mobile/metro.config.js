const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
const workspaceRoot = path.resolve(__dirname, '..', '..');
const sharedPackages = ['core', 'data'].map((name) => path.join(workspaceRoot, 'packages', name));

// Keep the project root on `apps/mobile`, but explicitly watch the workspace
// root so release bundling can still resolve the monorepo entry file.
config.watchFolders = Array.from(new Set([...(config.watchFolders ?? []), workspaceRoot, ...sharedPackages]));
config.resolver.nodeModulesPaths = [path.join(__dirname, 'node_modules')];

module.exports = config;
