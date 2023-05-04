import { Feature, FeatureState, features } from "../feature.js";
import { NodeContainer } from "../container.js";
import { camelCase, omit, set } from 'lodash-es'

export interface YamlTreeState extends FeatureState {
  [k: string] : any
}

export class YamlTree<T extends YamlTreeState = YamlTreeState> extends Feature<T> {
  static attach(container: NodeContainer & { yamlTree?: YamlTree }) {
    container.features.register("yamlTree", YamlTree);
    container.yamlTree = container.feature("yamlTree", { enable: true });
  }

  override get shortcut() {
    return "yamlTree" as const;
  }

  async loadTree(basePath: string, key: string = basePath.split('/')[0]) {
    const { container } = this;
    const yamlFeature = container.feature("yaml");
    const fileManager = container.feature("fileManager");
    const fileSystem = container.feature("fs");

    await fileManager.start()

    // Use the FileManager to find all YAML files in the tree.
    const yamlFiles = fileManager.matchFiles([
      `${basePath}/**/*.yml`, 
      `${basePath}/**/*.yaml`
    ]);

    const tree : any = {}

    for (const file of yamlFiles.filter(Boolean)) {
      if(file?.relativePath) {
        const fileContent = fileSystem.readFile(file.relativePath);
        const fileData = yamlFeature.parse(fileContent);
        const path = file.relativePath.replace(/\.ya?ml$/, "").replace(basePath + "/", "").split("/").filter(v => v?.length).map(p => camelCase(p));
        set(tree, path, fileData)
      }
    }

    // @ts-ignore-next-line
    this.setState({ ...this.tree, [key]: tree })
    
    return this.tree 
  }

  get tree() {
    return omit(this.state.current, 'enabled')
  }
}

export default features.register("yamlTree", YamlTree);

