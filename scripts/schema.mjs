import * as esbuild from 'esbuild'
import esbuildPluginPino from "esbuild-plugin-pino";
import {execSync} from "node:child_process";

const IS_DEV = !process.env.NODE_ENV || process.env.NODE_ENV === 'development'

/** @type import('esbuild').BuildContext */
const config = {
    entryPoints: ['./src/schema.ts'],
    outdir: './dist-schema',
    bundle: true,
    platform: 'node',
    target: 'node22',
    format: 'esm',
    packages: 'external',
    minify: false,
    sourcemap: false,
    metafile: true,
    plugins: [
        esbuildPluginPino({ transports: [] })
    ],
    define: {
        __PKG_NAME__: '"@harboor/auth-backend"',
        __PKG_VERSION__: '"v0.1.0"'
    }
}

const result = await esbuild.build(config)
const executable = Object.keys(result.metafile.outputs)[0]

console.log('Schema executable is ready: ' + executable)
