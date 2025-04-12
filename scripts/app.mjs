import * as esbuild from 'esbuild'
import esbuildPluginPino from "esbuild-plugin-pino";
import esbuildPluginDev from './lib/esbuild-plugin-dev.mjs'

const IS_DEV = !process.env.NODE_ENV || process.env.NODE_ENV === 'development'

/** @type import('esbuild').BuildContext */
const config = {
    entryPoints: ['./src/index.ts', './src/worker.ts'],
    outdir: './dist',
    bundle: true,
    platform: 'node',
    target: 'node22',
    format: 'esm',
    packages: 'external',
    minify: !IS_DEV,
    sourcemap: !IS_DEV,
    metafile: IS_DEV,
    plugins: [
        esbuildPluginPino({ transports: [] }),
        esbuildPluginDev
    ],
    define: {
        __PKG_NAME__: '"@harboor/auth-backend"',
        __PKG_VERSION__: '"v0.1.0"'
    }
}

if (IS_DEV) {
    const ctx = await esbuild.context(config)
    await ctx.watch()
}
else {
    await esbuild.build(config)
}
