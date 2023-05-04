import { Feature, FeatureOptions, FeatureState, features } from "../feature.js";
import { readdir, readFile } from 'fs/promises'
import { resolve, join, basename } from 'path'
import { mapValues, pickBy, uniqBy } from 'lodash-es'

type PackageIndex = {
  [name: string]: Array<PartialManifest & {
    __path: string;
  }>;
};

export interface PackageFinderState extends FeatureState {
  started?: boolean;
}

export interface PackageFinderOptions extends FeatureOptions {
  option?: string
}

export type PartialManifest = {
  name: string;
  version: string;
  description?: string;
  dependencies?: Record<string, Record<string,string>>;
  devDependencies?: Record<string, Record<string,string>>;
  peerDependencies?: Record<string, Record<string,string>>;
  optionalDependencies?: Record<string, Record<string,string>>;
} 

export class PackageFinder<
  T extends PackageFinderState = PackageFinderState,
  K extends PackageFinderOptions = PackageFinderOptions
> extends Feature<T, K> {

  packages: PackageIndex = {}

  afterInitialize() {
    this.state.set('started', false)
  }

  addPackage(manifest: PartialManifest, path: string) {
    const { name } = manifest
    
    if (!this.packages[name]) {
      this.packages[name] = []
    }
    
    this.packages[name] = uniqBy(this.packages[name].concat([{
      ...manifest,
      __path: path
    }]), '__path')
  }
  
  get duplicates() {
    return Object.keys(
      pickBy(this.packages, (packages) => packages.length > 1)
    )
  }

  async start() {
    if (this.isStarted) {
      return this;
    }
    
    await this.scan()
    
    this.state.set('started', true)
  }

  async scan(options: { exclude?: string | string[] } = {}) {
    const packageFolders = await this.findAllPackageFolders()
    const manifestPaths = packageFolders.map((folder) => `${folder}/package.json`)

    await Promise.all(
      manifestPaths.map((path) => 
        readFile(path).then((buf) => JSON.parse(String(buf))).then((manifest: PartialManifest) => {
          this.addPackage(manifest, path)
        })
      )
    )

    this.state.set('started', true)

    return this;
  }

  get isStarted() {
    return !!this.state.get("started");
  }
 
  get packageNames() {
    return Object.keys(this.packages)
  }
  
  get scopes() {
    return Array.from(
      new Set(this.packageNames.filter(p => p.startsWith('@')).map(p => p.split('/')[0]))
    )
  }
  
  findDependentsOf(packageName: string) {
    return this.filter(({ dependencies = {}, devDependencies = {} }) => {
      return packageName in dependencies || packageName in devDependencies
    })
  }

  find(filter: (manifest: PartialManifest) => boolean) {
    return this.manifests.find(filter)
  }
  
  filter(filter: (manifest: PartialManifest) => boolean) {
    return this.manifests.filter(filter)
  }

  exclude(filter: (manifest: PartialManifest) => boolean) {
    return this.manifests.filter((m) => !filter(m))
  }

  get manifests() {
    return Object.values(this.packages).flat()
  }
  
  get counts() {
    return mapValues(this.packages, (packages) => packages.length)
  }

  private async findPackageFolders(nodeModulesPath: string) {
    const topLevelFolders = await readdir(nodeModulesPath);
  
    const withScoped: Array<string[]> = await Promise.all(
      topLevelFolders.map(async (folder) => {
        const folderPath = join(nodeModulesPath, folder);
        if (folder.startsWith('@')) {
          return readdir(folderPath).then((subs) => subs.map((sub) => join(nodeModulesPath,folder,sub)))
        } else if (folder.startsWith('.')) {
          return []
        } else {
          return [folderPath];
        }
      })
    );
  
    const results = withScoped.flat()
  
    return results;
  }
   
  private async findAllPackageFolders() {
    const nodeModuleFolders = await this.findNodeModulesFolders()

    const allPackages = await Promise.all(
      nodeModuleFolders.map((folder) => this.findPackageFolders(folder))
    )
    
    return allPackages.flat()
  }

  private async findNodeModulesFolders() : Promise<string[]> {
    const folders = await this.container.fs.findUpAsync('node_modules', {
      multiple: true
    }) as string[]
    
    return folders || []
  }

}

export default features.register("packageFinder", PackageFinder);