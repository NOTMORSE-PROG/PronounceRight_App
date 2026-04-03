const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Allow Metro to bundle Whisper model (.bin) files as assets
config.resolver.assetExts.push('bin');

module.exports = withNativeWind(config, { input: './global.css' });
