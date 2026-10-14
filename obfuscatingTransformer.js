// obfuscatingTransformer.js
console.log('🚀 [ObfuscatingTransformer] Module loaded!');

const { transform } = require('@expo/metro-config/babel-transformer');
const JavaScriptObfuscator = require('javascript-obfuscator');
const generate = require('@babel/generator').default;
const parser = require('@babel/parser');
const path = require('path');

// Files/folders to obfuscate (your app code only)
const OBFUSCATE_PATTERNS = [
  'context/',
  'api/',
  'utils/',
  'screens/',
  'components/',
];

// Files to skip
const SKIP_PATTERNS = [
  'node_modules',
  '__tests__',
  '.test.',
  '.spec.',
];

function shouldObfuscate(filename) {
  // Skip node_modules and test files
  if (SKIP_PATTERNS.some(pattern => filename.includes(pattern))) {
    return false;
  }
  // Only obfuscate app code
  return OBFUSCATE_PATTERNS.some(pattern => filename.includes(pattern));
}

module.exports.transform = async function customTransform({ src, filename, options }) {
  // First, run the default Expo/Babel transform
  const result = await transform({ src, filename, options });

  const obfuscationEnabled = process.env.ENABLE_JS_OBFUSCATION === 'true';
  const shouldObf = shouldObfuscate(filename);

  // Only obfuscate when explicitly enabled and for app files
  if (!obfuscationEnabled || !shouldObf) {
    return result;
  }

  try {
    // Generate code from AST
    const { code } = generate(result.ast, {}, src);

    // Obfuscate the generated code - Metro-safe config (no control flow)
    const obfuscated = JavaScriptObfuscator.obfuscate(code, {
      compact: true,
      // Control flow DISABLED - breaks Metro require()
      controlFlowFlattening: false,
      // ALL string features DISABLED for Metro
      stringArray: false,
      transformObjectKeys: false,
      renameGlobals: false,
      renameProperties: false,
      selfDefending: false,
      deadCodeInjection: false,
      splitStrings: false,
      // Safe obfuscation
      numbersToExpressions: true,
      simplify: true,
      identifierNamesGenerator: 'hexadecimal',
    });

    // Parse obfuscated code back to AST (typescript project, not flow)
    const obfuscatedAst = parser.parse(obfuscated.getObfuscatedCode(), {
      sourceType: 'module',
      plugins: ['jsx'],  // No typescript needed - code is already compiled to JS
    });

    console.log('🔐 Obfuscated:', path.basename(filename));

    return {
      ...result,
      ast: obfuscatedAst,
    };
  } catch (error) {
    console.warn('⚠️ Obfuscation failed for', filename, ':', error.message);
    return result;
  }
};
