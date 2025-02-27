import eslint from '@eslint/js';
import prettier from 'eslint-config-prettier';
import eslintPluginPrettier from 'eslint-plugin-prettier/recommended';
import globals from 'globals';

export default [
  eslint.configs.recommended,
  eslintPluginPrettier,
  prettier,
  {
    files: ['src/**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.es2021,
        ...globals.node,
        chrome: 'readonly',
        browser: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'prettier/prettier': 'error',
    },
    ignores: ['dist/**/*', 'node_modules/**/*'],
  },
]; 