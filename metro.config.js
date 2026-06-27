// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add .wasm to asset extensions so expo-sqlite's web worker can resolve it
config.resolver.assetExts.push('wasm');

// Fix Metro validation warning about unknown watcher option
if (config.watcher) {
  delete config.watcher.unstable_workerThreads;
}

module.exports = config;
