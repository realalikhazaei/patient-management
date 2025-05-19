// import js from '@eslint/js';
import globals from 'globals';
import { defineConfig } from 'eslint/config';
import eslintPluginPrettier from 'eslint-plugin-prettier/recommended';

export default defineConfig([
  // { files: ['**/*.{js,mjs,cjs}'], plugins: { js }, extends: ['js/recommended'] },
  { files: ['**/*.js'], languageOptions: { sourceType: 'commonjs' } },
  { files: ['**/*.{js,mjs,cjs}'], languageOptions: { globals: globals.node } },
  eslintPluginPrettier,
  {
    rules: {
      'prettier/prettier': 'off',
      'no-console': 'warn',
      'no-eval': 'error',
      'no-implied-eval': 'warn',
      'no-var': 'warn',
      'no-undef': 'error',
      'no-unused-vars': 'warn',
      'consistent-return': 'off',
      'no-process-exit': 'off',
      'no-param-reassign': 'warn',
    },
  },
]);
