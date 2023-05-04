import { features, Feature } from "../feature.js";
import {
  mkdirSync,
  writeFileSync,
  readdirSync,
  statSync,
  readFileSync,
} from "fs";
import { join, resolve, dirname } from "path";
import { stat, unlink, mkdir, writeFile, readdir } from "fs/promises";
import { native as rimraf } from 'rimraf'

type WalkOptions = {
  directories?: boolean;
  files?: boolean;
  exclude?: string | string[];
  include?: string | string[];
};

export class FS extends Feature {
  override get shortcut() {
    return "fs" as const;
  }

  /**
   * Recursively walk a directory and return an array relative path names for each file,
   */
  walk(basePath: string, options: WalkOptions = {}) {
    const {
      directories = true,
      files = true,
      exclude = [],
      include = [],
    } = options;

    const walk = (baseDir: string) => {
      const results = {
        directories: [] as string[],
        files: [] as string[],
      };

      const entries = readdirSync(baseDir, { withFileTypes: true });

      for (const entry of entries) {
        const name = entry.name;
        const path = join(baseDir, name);
        const isDir = entry.isDirectory();

        if (isDir && directories) {
          results.directories.push(path);
        }

        if (!isDir && files) {
          results.files.push(path);
        }

        if (isDir) {
          const subResults = walk(path);
          results.files.push(...subResults.files);
          results.directories.push(...subResults.directories);
        }
      }

      return results;
    };

    return walk(this.container.paths.resolve(basePath));
  }

  async walkAsync(baseDir: string, options: WalkOptions = {}) {
    const {
      directories = true,
      files = true,
      exclude = [],
      include = [],
    } = options;

    const walk = async (baseDir: string) => {
      const results = {
        directories: [] as string[],
        files: [] as string[],
      };

      const entries = await readdir(baseDir, { withFileTypes: true });

      for (const entry of entries) {
        const name = entry.name;
        const path = join(baseDir, name);
        const isDir = entry.isDirectory();

        if (isDir && directories) {
          results.directories.push(path);
        }

        if (!isDir && files) {
          results.files.push(path);
        }

        if (isDir) {
          const subResults = await walk(path);
          results.files.push(...subResults.files);
          results.directories.push(...subResults.directories);
        }
      }

      return results;
    };

    return walk(this.container.paths.resolve(baseDir));
  }

  async ensureFileAsync(path: string, content: string, overwrite = false) {
    path = this.container.paths.resolve(path);

    if (this.exists(path) && !overwrite) {
      return path;
    }

    const { dir } = this.container.paths.parse(path);
    await mkdir(dir, { recursive: true });
    await writeFile(path, content);
    return path;
  }

  ensureFolder(path: string) {
    path = this.container.paths.dirname(this.container.paths.resolve(path));
    mkdir(path, { recursive: true });
    return path;
  }

  ensureFile(path: string, content: string, overwrite = false) {
    path = this.container.paths.resolve(path);

    if (this.exists(path) && !overwrite) {
      return path;
    }

    const { dir } = this.container.paths.parse(path);
    mkdirSync(dir, { recursive: true });
    writeFileSync(path, content);
    return path;
  }

  /**
   * Syncronously find a file by walking up the tree from the current working directory
   */
  findUp(fileName: string, options: { cwd?: string } = {}): string | null {
    const { cwd = this.container.cwd } = options;
    let startAt = cwd;

    // walk up the tree until we find the fileName exists
    if (this.exists(join(startAt, fileName))) {
      return resolve(startAt, fileName);
    }

    // walk up the tree until we find the fileName exists
    while (startAt !== dirname(startAt)) {
      startAt = dirname(startAt);
      if (this.exists(join(startAt, fileName))) {
        return resolve(startAt, fileName);
      }
    }

    return null;
  }

  async existsAsync(path: string) {
    const { container } = this;
    const filePath = container.paths.resolve(path);
    const exists = await stat(filePath)
      .then(() => true)
      .catch((e) => false);
  }

  /**
   * Synchronously check if a file exists
   */
  exists(path: string): boolean {
    const { container } = this;
    const filePath = container.paths.resolve(path);

    try {
      statSync(filePath);
      return true;
    } catch (error) {
      return false;
    }
  }

  async rm(path: string) {
    return await unlink(this.container.paths.resolve(path));
  }

  /**
   * Synchronously Read JSON at the given path.
   */
  readJson(path: string) {
    const { container } = this;
    const filePath = container.paths.resolve(path);
    return JSON.parse(readFileSync(filePath).toString());
  }

  readFile(path: string) {
    const { container } = this;
    const filePath = container.paths.resolve(path);
    return readFileSync(filePath).toString();
  }

  async rmdir(dirPath: string) {
    await rimraf(this.container.paths.resolve(dirPath));
  }

  async findUpAsync(
    fileName: string,
    options: { cwd?: string; multiple?: boolean } = {}
  ): Promise<string | string[] | null> {
    const { cwd = this.container.cwd, multiple = false } = options;
    let startAt = cwd;
    const foundFiles = [];

    const fileExistsInDir = async (dir: string, file: string) => {
      try {
        await stat(join(dir, file));
        return true;
      } catch (error) {
        return false;
      }
    };

    if (await fileExistsInDir(startAt, fileName)) {
      if (multiple) {
        foundFiles.push(resolve(startAt, fileName));
      } else {
        return resolve(startAt, fileName);
      }
    }

    while (startAt !== dirname(startAt)) {
      startAt = dirname(startAt);
      if (await fileExistsInDir(startAt, fileName)) {
        if (multiple) {
          foundFiles.push(resolve(startAt, fileName));
        } else {
          return resolve(startAt, fileName);
        }
      }
    }

    if (multiple && foundFiles.length > 0) {
      return foundFiles;
    }

    return null;
  }
}

export default features.register("fs", FS);
