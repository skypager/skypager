import { Feature, FeatureState, features } from "../feature.js";
import { NodeContainer } from "../container.js";
import { camelCase, omit, set } from 'lodash-es';

export interface JsonTreeState extends FeatureState {
  [k: string]: any;
}

export class JsonTree<T extends JsonTreeState = JsonTreeState> extends Feature<T> {
  static attach(container: NodeContainer & { jsonTree?: JsonTree }) {
    container.features.register("jsonTree", JsonTree);
  }

  override get shortcut() {
    return "jsonTree" as const;
  }

  async loadTree(basePath: string, key: string = basePath.split('/')[0]) {
    const { container } = this;
    const fileManager = container.feature("fileManager");
    const fileSystem = container.feature("fs");

    await fileManager.start()

    // Use the FileManager to find all JSON files in the tree.
    const jsonFiles = fileManager.matchFiles([`${basePath}/**/*.json`]);

    const tree: any = {};

    for (const file of jsonFiles.filter(Boolean)) {
      if (file?.relativePath) {
        const fileContent = fileSystem.readFile(file.relativePath);
        const fileData = JSON.parse(fileContent);
        const path = file.relativePath
          .replace(/\.json$/, "")
          .replace(basePath + "/", "")
          .split("/")
          .filter((v) => v?.length)
          .map((p) => camelCase(p));
        set(tree, path, fileData);
      }
    }

    // @ts-ignore-next-line
    this.setState({ ...this.tree, [key]: tree });

    return this.tree;
  }

  get tree() {
    return omit(this.state.current, 'enabled');
  }
}

export default features.register("jsonTree", JsonTree);
