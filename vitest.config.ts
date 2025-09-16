/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        environment: 'node',
        globals: true,
        setupFiles: ['./test/setup.ts'],
        include: [
            'test/**/*.test.ts',
            'test/**/*.spec.ts',
            'lib/**/*.test.ts',
            'lib/**/*.spec.ts'
        ],
        exclude: ['demos/**', 'node_modules/**', 'dist/**'],
        coverage: {
            exclude: [
                'demos/**',
                'node_modules/**',
                'dist/**',
                'coverage/**',
                'test/**',
                '**/*.config.*',
                '**/*.d.ts',
                'lib/wasm_exec.js'
            ],
            reporter: ['text', 'lcov']
        }
    }
});
