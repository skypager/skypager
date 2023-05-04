import { dirname } from 'path';
import { State } from '../../state.js';
import { features, FeatureState, Feature } from '../feature.js'

type LsFilesOptions = {
    cached?: boolean;
    deleted?: boolean;
    modified?: boolean;
    others?: boolean;
    ignored?: boolean;
    status?: boolean;
    includeIgnored?: boolean;
    exclude?: string | string[];
    baseDir?: string;
}

interface GitState extends FeatureState {
    repoRoot?: string;
}

export class Git extends Feature {
    override state: State<GitState> = new State()
    override get shortcut() {
        return 'git' as const
    }

    async lsFiles(options: LsFilesOptions = {}) {
        const { 
            cached = false, 
            deleted = false, 
            modified = false, 
            others = false,
            ignored = false, 
            status = false, 
            baseDir = '',
            includeIgnored = false
        } = options || {}
        
        const exclude = Array.isArray(options.exclude) ? options.exclude : [options.exclude || ''].filter(v => v?.length)
        
        const flags = [
            cached ? '--cached' : '',
            deleted ? '--deleted' : '',
            modified ? '--modified' : '',
            others ? '--others' : '',
            ignored ? '--ignored' : '',
            status ? '-t' : '',
        ].filter(v => v?.length).flat()
        
        const gitIgnorePath = this.container.fs.findUp('.gitignore', { cwd: this.container.cwd })
        
        if (others && exclude.length) {
            flags.push(
                ...exclude.map((p:string) =>['--exclude', p]).flat()
            )
        }
        
        if (others && gitIgnorePath && !includeIgnored) {
            flags.push(...['--exclude-from', gitIgnorePath])
        }
        
        return this.container.proc.exec(`git ls-files ${baseDir} ${flags.join(' ')}`, { 
            cwd: this.repoRoot,
            maxBuffer: 1024 * 1024 * 100,
        }).trim().split("\n")
    }
    
    get branch() {
        if(!this.isRepo) { return null }
        return this.container.proc.exec('git branch').split("\n").filter(line => line.startsWith('*')).map(line => line.replace('*', '').trim()).pop()
    }
    
    get sha() {
        if(!this.isRepo) { return null }
        return this.container.proc.exec('git rev-parse HEAD', { cwd: this.repoRoot })
    }
    
    get isRepo() {
        return !!this.repoRoot
    }
    
    get isRepoRoot() {
        return this.repoRoot == this.container.cwd
    }
    
    get repoRoot() {
        if (this.state.has('repoRoot')) {
            return this.state.get('repoRoot')
        }
        
        const repoRoot = this.container.fs.findUp('.git')
       
        if(typeof repoRoot === 'string') {
            this.state.set('repoRoot', dirname(repoRoot))
            return dirname(repoRoot)
        }

        return null 
    }
}

export default features.register('git', Git)