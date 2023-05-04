import type { NodeFeatures, NodeContainer } from './container.js'
import { FeatureOptions, FeatureState, features, Feature as UniversalFeature } from '../feature.js'

export { features }

export type { FeatureState, FeatureOptions }

export class Feature<T extends FeatureState = FeatureState, K extends FeatureOptions = FeatureOptions> extends UniversalFeature<T, K> {
    override get container() : NodeContainer<NodeFeatures> {
        return super.container as NodeContainer<NodeFeatures>
    }
}