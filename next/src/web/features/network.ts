import { features, Feature, FeatureOptions, FeatureState } from "../feature.js";
import type { Container, ContainerContext } from "../container.js";

interface NetworkState extends FeatureState {
  offline: boolean;
}

interface NetworkOptions extends FeatureOptions {}

export class Network<
  T extends NetworkState = NetworkState,
  K extends NetworkOptions = NetworkOptions
> extends Feature<T, K> {
  
  static attach(container: Container & { network?: Network }) {
    container.features.register("network", Network);
  }
  
  constructor(options: K, context: ContainerContext) {
    super(options, context);
    this.state.set("offline", !navigator.onLine);
  }

  get shortcut() {
    return "network" as const;
  }

  get isOffline() {
    return this.state.get("offline") === true;
  }

  get isOnline() {
    return this.state.get("offline") === false;
  }

  private handleConnectionChange = () => {
    const isOffline = !navigator.onLine;
    this.state.set('offline', isOffline)
    this.emit(isOffline ? "offline" : "online");
  };

  start() {
    window.addEventListener("online", this.handleConnectionChange);
    window.addEventListener("offline", this.handleConnectionChange);
    return this
  }

  disable() {
    window.removeEventListener("online", this.handleConnectionChange);
    window.removeEventListener("offline", this.handleConnectionChange);
    return this
  }
}

export default features.register('network', Network)