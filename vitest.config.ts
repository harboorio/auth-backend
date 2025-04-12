import path from 'node:path'
import { defineConfig } from 'vitest/config'
import { loadEnv } from 'vite'

export default defineConfig(async ({ mode }) => {
    return {
        test: {
            env: loadEnv(mode, process.cwd(), ''),
            alias: {
                '@features/': path.resolve(import.meta.dirname, 'src', 'features') + '/',
                '@services/': path.resolve(import.meta.dirname, 'src', 'services') + '/',
                '@infra/': path.resolve(import.meta.dirname, 'src', 'infra') + '/',
                '@src/': path.resolve(import.meta.dirname, 'src') + '/'
            },
            //globalSetup: path.resolve(import.meta.dirname, 'vitest/setup.ts')
        }
    }
})