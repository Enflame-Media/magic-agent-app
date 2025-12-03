import { defineConfig } from 'vitest/config'
import { resolve } from 'node:path'

export default defineConfig({
    test: {
        globals: false,
        environment: 'node',
        include: ['sources/**/*.{spec,test}.ts'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            exclude: [
                'node_modules/**',
                'dist/**',
                '**/*.d.ts',
                '**/*.config.*',
                '**/mockData/**',
                '**/*.spec.ts',
                '**/*.test.ts',
            ],
            thresholds: {
                lines: 60,
                functions: 60,
                branches: 50,
            },
        },
    },
    resolve: {
        alias: {
            '@': resolve('./sources'),
        },
    },
})