import { features, Feature } from '../feature.js'
import { execSync } from 'child_process'
import * as asyncProc from 'child-process-promise'

export class ChildProcess extends Feature {
    override get shortcut() {
        return 'proc' as const
    }
   
    async execAndCapture(cmd: string, options?: any)  : Promise<{ stderr: string, stdout: string, error: null | any, exitCode: number, pid: number | null }> {
        const [command, ...args] = cmd.split(' ')        
        return this.spawnAndCapture(command, args, options)
    }
    /** 
     * This will spawn a process and capture the output for you.
     * 
     * For long running processes where you want to capture the output as it happens,
     * you can pass onOutput, onError callbacks.
    */
    async spawnAndCapture(command: string, args: string[], options?: any) : Promise<{ stderr: string, stdout: string, error: null | any, exitCode: number, pid: number | null }> {
        let stderr = ''
        let stdout = ''
        let pid : number | null = null 
        let exitCode : number = 0 
        let error: any = null
        
        const { cwd = this.container.cwd, onError = (data: string) => {}, onOutput = (data:string) => {} } = options || {}
        
        const proc = asyncProc.spawn(command, args, {
            ...options,
            cwd,
        })

        const childProcess = proc.childProcess!

        if(childProcess.stdout && childProcess.stderr) {
            childProcess.stdout.on('data', (buf: Buffer) => {
                stdout = stdout + buf.toString()
                onOutput(buf.toString())
            })
            
            childProcess.stderr.on('data', (buf: Buffer) => {
                stderr = stderr + buf.toString()
                onError(buf.toString())
            })

        } else {
            throw new Error(`Unable to spawn process ${command}`)
        }
   
        if(typeof childProcess.exitCode === 'number') {
            exitCode = childProcess.exitCode
        }
        
        if (typeof childProcess.pid === 'number') {
            pid = childProcess.pid
        }
        
        await proc.catch((err: any) => {
          error = err
        })

        return {
            stderr,
            stdout,
            exitCode,
            pid,
            error
        }
    }

    exec(command: string, options?: any) : string {
        return execSync(command, {
            cwd: this.container.cwd,
            ...options,
        }).toString().trim()
    }
}

export default features.register('proc', ChildProcess)