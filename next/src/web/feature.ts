import type { WebContainer } from './container.js'
import { FeatureOptions, FeatureState, AvailableFeatures, features, Feature as UniversalFeature } from '../feature.js'

export { features }

export type { AvailableFeatures, FeatureState, FeatureOptions }

export class Feature<T extends FeatureState = FeatureState, K extends FeatureOptions = FeatureOptions> extends UniversalFeature<T, K> {
    override get container() : WebContainer {
        return super.container as WebContainer 
    }
}