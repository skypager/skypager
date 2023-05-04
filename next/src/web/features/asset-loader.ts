import { Feature, features } from "../feature.js";
import { Container } from "../container.js";

export class AssetLoader extends Feature {
  static attach(container: Container & { assetLoader?: AssetLoader }) {
    container.features.register("assetLoader", AssetLoader);
  }

  override get shortcut() {
    return "assetLoader" as const;
  }

  static loadStylesheet(href: string) {
    return new Promise((resolve, reject) => {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = href;
      link.onload = () => resolve(link);
      link.onerror = () => reject(new Error(`Failed to load stylesheet: ${href}`));

      document.head.appendChild(link);
    });
  }

  removeStylesheet(href:string) {
    const links = document.querySelectorAll(`link[href="${href}"]`);

    links.forEach((link) => {
      document.head.removeChild(link);
    });
  }

  async loadScript(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = url;
      script.async = true;

      script.onload = () => {
        resolve();
      };

      script.onerror = () => {
        reject(new Error(`Failed to load script: ${url}`));
      };

      document.head.appendChild(script);
    });
  }

  async unpkg(packageName: string, globalName: string): Promise<any> {
    const url = `https://unpkg.com/${packageName}`;
    await this.loadScript(url);
    return (window as any)[globalName];
  }
}

export default features.register("assetLoader", AssetLoader);