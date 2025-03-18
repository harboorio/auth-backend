import path from "node:path";
import * as esbuild from 'esbuild'
import esbuildPluginPino from "esbuild-plugin-pino";
import { readFile, rm } from 'node:fs/promises'
import { spawn, spawnSync } from 'node:child_process'
import { hasPathvCalls, processPathvCalls } from '@harboor/core'
import { debounce } from "underscore";

class ServerProcess {
    proc = null
    env = {}
    entryFile = ''
    features = {
        watchPath: '',
        sourceMaps: false,
        envFile: ''
    }

    constructor({ watchPath,  sourceMaps, envFile }) {
        if (watchPath) this.features.watchPath = watchPath
        if (sourceMaps) this.features.sourceMaps = true
        if (envFile) {
            this.features.envFile = envFile
            this.readEnv()
        }

        process.on('SIGTERM', () => {
            this.proc && this.proc.kill('SIGTERM')
        })
    }

    readEnv() {
        const { stdout } = spawnSync('./shdotenv', [
            '-e',
            this.features.envFile,
            '-f',
            'json'
        ])
        this.env = JSON.parse(stdout.toString())
    }

    restart(entryFile) {
        this.entryFile = entryFile
        if (this.proc) console.log('proc status', this.proc.killed ? 'killed' : 'alive')
        else console.log('proc status', 'not started yet')
        return this.proc && !this.proc.killed ? this.proc.kill('SIGHUP') : this.start()
    }

    start() {
        console.log('starting dev server process...')

        const args = []
        if (this.features.sourceMaps) args.push('--enable-source-maps')
        //if (this.features.watchPath) args.push('--watch', '--watch-path', this.features.watchPath)
        args.push(this.entryFile)

        this.proc = spawn('node', args, { stdio: 'inherit', env: Object.assign({}, process.env, this.env) })

        this.proc.on('close', (code, signal) => {
            console.log('closing dev server process. (signal: "' + signal + '", code: ' + code + ')')

            if ((signal && signal !== 'SIGTERM') || !signal) this.start()
        })
    }
}

const IS_DEV = !process.env.NODE_ENV || process.env.NODE_ENV === 'development'
const proc = new ServerProcess({
    watchPath: 'src',
    sourceMaps: true,
    envFile: path.resolve(import.meta.dirname, './.env')
})

/** @type import('esbuild').Plugin */
const ourPlugin = {
    name: 'our-plugin',

    setup(build) {
        const src = 'src'
        const dist = 'dist'
        const restartDevServerThrottled = debounce(function restartDevServer(filepath) {
            proc.restart(filepath)
        }, 3000)

        build.onStart(async () => {
            console.log('rebuilding the app...')
        })

        build.onLoad({ filter: /(\.(js|ts|mjs|cjs))$/ }, async (args) => {
            const content = await readFile(args.path, 'utf8')

            if (hasPathvCalls(content)) {
                const formatted = await processPathvCalls(content, args.path, src, dist)
                return { contents: formatted, loader: 'default' }
            }

            return { contents: content, loader: 'default' }
        })

        build.onEnd(async (result) => {
            if (result.metafile) {
                restartDevServerThrottled(Object.keys(result.metafile.outputs)[0])
            }
        })
    }
}

/** @type import('esbuild').BuildContext */
const config = {
    entryPoints: ['./src/index.ts'],
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
        ourPlugin
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

async function cleanup(dist) {
    await rm(dist, { recursive: true, force: true })
}
