import { State } from "../../state.js";
import { Feature, FeatureOptions, FeatureState, features } from "../feature.js";
import { parse } from "path";
import { statSync } from "fs";
import micromatch from "micromatch";
import { castArray, keyBy, mapValues } from "lodash-es";
import chokidar from "chokidar";
import type { FSWatcher, WatchOptions } from "chokidar";

type File = {
  absolutePath: string;
  relativePath: string;
  dirname: string;
  name: string;
  extension: string;
  size: number;
};

export interface FileManagerState extends FeatureState {
  started?: boolean;
  starting?: boolean;
  watching?: boolean;
  failed?: boolean;
}

export interface FileManagerOptions extends FeatureOptions {
  exclude?: string | string[];
}

export class FileManager<
  T extends FileManagerState = FileManagerState,
  K extends FileManagerOptions = FileManagerOptions
> extends Feature<T, K> {
  files: State<Record<string, File>> = new State<Record<string, File>>({
    initialState: {},
  });

  get fileIds() {
    return Array.from(this.files.keys());
  }
  
  get fileObjects() {
    return Array.from(this.files.values());
  }

  match(patterns: string | string[]) {
    return micromatch(this.files.keys(), patterns);
  }

  matchFiles(patterns: string | string[]) {
    const fileIds = this.match(Array.isArray(patterns) ? patterns : [patterns]);
    return fileIds.map((fileId) => this.files.get(fileId));
  }

  get directoryIds() {
    return Array.from(
      new Set(
        this.files
          .values()
          .map((file) => this.container.paths.relative(file.dirname))
          .filter(v => v.length)
      )
    );
  }

  get isStarted() {
    return !!this.state.get("started");
  }

  get isStarting() {
    return !!this.state.get("starting");
  }

  get isWatching() {
    return !!this.state.get("watching");
  }

  async start(options: { exclude?: string | string[] } = {}) {
    if (this.isStarted) {
      return this;
    }

    if (this.isStarting) {
      await this.waitFor("started");
      return this;
    } else {
      this.state.set("starting", true);
    }

    try {
      await this.scanFiles(options);
    } catch (error) {
      console.error(error);
      this.state.set("failed", true);
    } finally {
      this.state.set("started", true);
      this.state.set("starting", false);
    }

    return this;
  }

  async scanFiles(options: { exclude?: string | string[] } = {}) {
    const { cwd, git, fs } = this.container;

    const fileIds: string[] = [];

    if (!Array.isArray(options.exclude)) {
      options.exclude = [options.exclude!].filter((v) => v?.length);
    }

    const { exclude = ["dist", "node_modules", "out"] } = options;

    exclude.push(...castArray(this.options.exclude!).filter((v) => v?.length));

    exclude.push("node_modules");
    exclude.push("out");
    exclude.push("dist");

    if (git.isRepo) {
      const deleted = await git.lsFiles({ deleted: true })
      await git.lsFiles().then((results) => fileIds.push(...results.filter((id:string) => !deleted.includes(id))));
      await git
        .lsFiles({ others: true, includeIgnored: true, exclude })
        .then((results) => fileIds.push(...results.filter((id:string) => !deleted.includes(id))));
    } else {
      await fs.walkAsync(cwd).then(({ files } : { files: string[] }) => fileIds.push(...files));
    }

    fileIds.forEach((relativePath) => {
      const absolutePath = this.container.paths.resolve(relativePath);
      const { name, ext, dir } = parse(absolutePath);
      const size = statSync(absolutePath).size;

      this.files.set(relativePath, {
        dirname: dir,
        absolutePath,
        relativePath,
        name,
        extension: ext,
        size,
      });
    });

    return this;
  }

  watcher: FSWatcher | null = null;

  get watchedFiles(): Record<string, string[]> {
    return this.watcher?.getWatched() || {};
  }

  async watch(options: { exclude?: string | string[] } = {}) {
    if (this.isWatching) {
      return;
    }

    if (!Array.isArray(options.exclude)) {
      options.exclude = [options.exclude!].filter((v) => v?.length);
    }

    const {
      exclude = [".git/**", "dist/**", "node_modules/**", "out/**", "build/**"],
    } = options;

    exclude.push(...castArray(this.options.exclude!).filter((v) => v?.length));

    const { cwd } = this.container;

    const watcher = chokidar.watch(
      this.directoryIds.map(id => this.container.paths.resolve(id)) 
      , {
      ignoreInitial: true,
      persistent: true,
      ignored: [
        '.git/**',
        ...[".git", "dist/**", "node_modules/**", "out/**", "build/**"],
        ...exclude,
      ].map((pattern) => micromatch.makeRe(pattern)).concat([
        /\.git/,
        /node_modules/
      ]),
    });

    watcher
      .on("add", (path) => {
        this.emit("file:change", {
          type: "add",
          path,
        });
        this.updateFile(path);
      })
      .on("change", (path) => {
        this.updateFile(path);
        this.emit("file:change", {
          path,
          type: "change",
        });
      })
      .on("unlink", (path) => {
        this.removeFile(path);
        this.emit("file:change", {
          type: "delete",
          path,
        });
      });

    watcher.on("ready", () => {
      this.state.set("watching", true);
    });

    this.watcher = watcher;
  }

  async stopWatching() {
    if (!this.isWatching) {
      return;
    }

    if (this.watcher) {
      this.watcher.close();
      this.state.set("watching", false);
      this.watcher = null;
    }
  }

  async updateFile(path: string) {
    // Reuse the logic from the scanFiles method to update a single file
    const absolutePath = this.container.paths.resolve(path);
    const { name, ext, dir } = parse(absolutePath);
    const size = statSync(absolutePath).size;

    this.files.set(path, {
      dirname: dir,
      absolutePath,
      relativePath: path,
      name,
      extension: ext,
      size,
    });
  }

  async removeFile(path: string) {
    this.files.delete(path);
  }
}

export default features.register("fileManager", FileManager);
