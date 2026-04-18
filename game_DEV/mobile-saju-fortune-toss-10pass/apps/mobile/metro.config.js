const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
const workspaceRoot = path.resolve(__dirname, '..', '..');
const sharedPackages = ['core', 'data'].map((name) => path.join(workspaceRoot, 'packages', name));
const escapePathForRegex = (value) => value.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&');
const ignoredWorkspaceDirs = ['mobile-saju-fortune', 'tmp'];

// Keep the project root on `apps/mobile`, but explicitly watch the workspace
// root so release bundling can still resolve the monorepo entry file.
config.watchFolders = Array.from(new Set([...(config.watchFolders ?? []), workspaceRoot, ...sharedPackages]));
config.resolver.nodeModulesPaths = [path.join(__dirname, 'node_modules'), path.join(workspaceRoot, 'node_modules')];
config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules ?? {}),
  '@babel/runtime': path.join(__dirname, 'node_modules', '@babel', 'runtime'),
};
config.resolver.blockList = new RegExp(
  ignoredWorkspaceDirs
    .map((dirName) => `^${escapePathForRegex(path.join(workspaceRoot, dirName))}[/\\\\].*`)
    .join('|'),
);

module.exports = config;
