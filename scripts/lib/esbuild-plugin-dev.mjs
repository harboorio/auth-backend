import path from "node:path";
import {debounce} from "underscore";
import {readFile} from "node:fs/promises";
import {hasPathvCalls, processPathvCalls} from "@harboor/core";
import ServerProcess from './server-process.mjs'

const proc = new ServerProcess({
    sourceMaps: true,
    envFile: path.resolve(process.cwd(), './.env')
})
const proc2 = new ServerProcess({
    sourceMaps: true,
    envFile: path.resolve(process.cwd(), './.env')
})

/** @type import('esbuild').Plugin */
export default {
    name: 'our-plugin',

    setup(build) {
        const src = 'src'
        const dist = 'dist'
        const restartDevServerThrottled = debounce(function restartDevServer(server, worker) {
            proc2.restart(worker)
            proc.restart(server)
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
                const [ server, worker, ...rest ] = Object.keys(result.metafile.outputs)
                restartDevServerThrottled(server, worker)
            }
        })
    }
}