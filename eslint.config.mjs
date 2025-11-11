// @ts-check

import eslint from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import tseslint from 'typescript-eslint';
import { includeIgnoreFile } from '@eslint/compat';
import { fileURLToPath, URL } from 'node:url';
import eslintConfigPrettier from 'eslint-config-prettier/flat';

const gitignorePath = fileURLToPath(new URL('.gitignore', import.meta.url));

export default defineConfig(
  eslint.configs.recommended,
  tseslint.configs.recommended,
  eslintConfigPrettier,
  includeIgnoreFile(gitignorePath),
  globalIgnores(['dist/**/*'], 'Ignore Dist Directory'),
  globalIgnores(['demos/**/*'], 'Ignore Demos Directory'),
  globalIgnores(['lib/wasm_exec.js'], 'Ignore Wasm Exec File'),
  globalIgnores(['webpack.config.js'], 'Ignore Webpack Config File'),
  {
    files: ['**/*.test.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_'
        }
      ]
    }
  }
);
