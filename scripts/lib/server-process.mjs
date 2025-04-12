import {spawn, spawnSync} from "node:child_process";

export default class ServerProcess {
    proc = null
    env = {}
    entryFile = ''
    features = {
        sourceMaps: false,
        envFile: ''
    }

    constructor({ sourceMaps, envFile }) {
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
        args.push(this.entryFile)

        this.proc = spawn('node', args, { stdio: 'inherit', env: Object.assign({}, process.env, this.env) })

        this.proc.on('close', (code, signal) => {
            console.log('closing dev server process. (signal: "' + signal + '", code: ' + code + ')')

            if ((signal && signal !== 'SIGTERM') || !signal) this.start()
        })
    }
}