import url from 'node:url'

import { Container, ContainerState } from "../container.js";
import { State } from "../state.js";
import { features, FeatureOptions, Feature } from "./feature.js";
import type { AvailableFeatures } from "../feature.js";
import { Client, ClientsInterface } from "../client.js";
import { Server, ServersInterface } from "../server/index.js";

import minimist from "minimist";
import { omit, kebabCase, camelCase, mapKeys, castArray } from "lodash-es";
import { basename, parse, relative, resolve, join } from "path";

import "./features/fs.js";
import "./features/esbuild.js";
import "./features/disk-cache.js";
import "./features/proc.js";
import "./features/git.js";
import "./features/os.js";
import "./features/networking.js";
import "./features/ui.js";
import "./features/file-manager.js";
import "./features/package-finder.js";
import "./features/yaml.js";
import "./features/yaml-tree.js";
import "./features/json-tree.js";
import "./features/ipc-socket.js";
import "./features/package-finder.js";
import "./features/repl.js";
import "./features/vm.js";
import "./features/yaml.js";
import "./features/vault.js";
import "./features/script-runner.js";

import type { FileManager } from "./features/file-manager.js";
import type { DiskCache } from "./features/disk-cache.js";
import type { FS } from "./features/fs.js";
import type { ESBuild } from "./features/esbuild.js";
import type { Git } from "./features/git.js";
import type { ChildProcess } from "./features/proc.js";
import type { OS } from "./features/os.js";
import type { Networking } from "./features/networking.js";
import type { UI } from "./features/ui.js";
import type { PackageFinder } from "./features/package-finder.js";
import type { YamlTree } from "./features/yaml-tree.js";
import type { JsonTree } from "./features/json-tree.js";
import type { IpcSocket } from "./features/ipc-socket.js";
import type { Repl } from "./features/repl.js";
import type { VM } from "./features/vm.js";
import type { YAML } from "./features/yaml.js";
import type { Vault } from "./features/vault.js";
import type { ScriptRunner } from "./features/script-runner.js";

export { State };

export {
  features,
  Feature,
  FeatureOptions,
  FS,
  ChildProcess,
  Git,
  OS,
  Networking,
  UI,
  FileManager,
  DiskCache,
  Vault,
  ScriptRunner
};

const baseArgv = minimist(process.argv.slice(2)) as Record<string, any> & {
  _: string[];
  cwd?: string;
};
const argv = {
  ...baseArgv,
  ...mapKeys(omit(baseArgv, "_"), (_, key) => camelCase(kebabCase(key))),
};

declare module "../container.js" {
  interface ContainerArgv {
    cwd?: string;
    _?: string[];
    enable?: string | string[];
  }
}

export interface NodeFeatures extends AvailableFeatures {
  fs: typeof FS;
  scriptRunner: typeof ScriptRunner;
  proc: typeof ChildProcess;
  git: typeof Git;
  os: typeof OS;
  networking: typeof Networking;
  ui: typeof UI;
  vm: typeof VM;
  fileManager: typeof FileManager;
  ipcSocket: typeof IpcSocket;
  yamlTree: typeof YamlTree;
  packageFinder: typeof PackageFinder;
  repl: typeof Repl;
  yaml: typeof YAML;
  esbuild: typeof ESBuild;
  diskCache: typeof DiskCache;
  vault: typeof Vault;
  jsonTree: typeof JsonTree;
}

export type ClientsAndServersInterface = ClientsInterface & ServersInterface;

export interface NodeContainer extends ClientsAndServersInterface {}

export class NodeContainer<
  Features extends NodeFeatures = NodeFeatures,
  K extends ContainerState = ContainerState
> extends Container<Features, K> {
  fs!: FS;
  git!: Git;
  proc!: ChildProcess;
  os!: OS;
  networking!: Networking;
  ui!: UI;

  vm!: VM;

  fileManager?: FileManager;
  scriptRunner?: ScriptRunner;
  ipcSocket?: IpcSocket;
  yamlTree?: YamlTree;
  packageFinder?: PackageFinder;
  repl?: Repl;
  esbuild?: ESBuild;
  diskCache?: DiskCache;
  vault?: Vault;

  constructor(options: any = {}) {
    super({ cwd: process.cwd(), ...argv, ...options });

    this.feature("fs", { enable: true });
    this.feature("proc", { enable: true });
    this.feature("git", { enable: true });
    this.feature("os", { enable: true });
    this.feature("networking", { enable: true });
    this.feature("ui", { enable: true });
    this.feature("vm", { enable: true });

    const enable = castArray(this.options.enable)
      .filter((v) => v && v?.length)
      .map((v) => v as keyof AvailableFeatures);

    enable.forEach((feature) => {
      if (this.features.has(feature)) {
        this.feature(feature, { enable: true });
      }
    });

    this.use(Client).use(Server);
  }

  override get Feature() {
    return Feature;
  }

  get cwd(): string {
    return this.options.cwd || process.cwd();
  }

  get manifest() {
    try {
      const packageJson = this.fs.findUp("package.json");

      if (!packageJson) {
        throw new Error("No package.json found");
      }

      const manifest = this.fs.readJson(packageJson);

      return manifest;
    } catch (error) {
      return {
        name: basename(this.cwd),
        version: "0.0.0",
        type: "module",
      };
    }
  }

  get argv() {
    return this.options as any;
  }

  get urlUtils() {
    return {
      parse: (uri: string) => url.parse(uri) 
    }
  }

  get paths() {
    const { cwd } = this;
    return {
      dirname(path: string) {
        return parse(path).dir
      },
      parse(path: string) {
        return parse(path);
      },
      join(...paths: string[]) {
        return join(cwd, ...paths);
      },
      resolve(...paths: string[]) {
        return resolve(cwd, ...paths);
      },
      relative(...paths: string[]) {
        return relative(cwd, resolve(cwd, ...paths));
      },
    };
  }
}
