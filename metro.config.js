// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Codemagic explicitly enables obfuscation; local production builds keep the default transformer.
if (process.env.ENABLE_JS_OBFUSCATION === 'true') {
  console.log('');
  console.log('🔐 [Metro] Obfuscating transformer ENABLED');
  console.log('');

  config.transformer.babelTransformerPath = path.resolve(__dirname, 'obfuscatingTransformer.js');
}

module.exports = config;
