import {  Helper } from './helper.js';
import type { HelperOptions, HelperState } from './helper.js'
import { Registry } from './registry.js'
import type { ContainerContext } from './container.js'
import { kebabCase, camelCase } from 'lodash-es'
import { YAML } from './node/features/yaml.js';

/** 
 * Use module augmentation to register features, the same way you would register
 * them at runtime.  This will help developers get autocomplete etc.
*/
export interface AvailableFeatures { 
    yaml: typeof YAML
}

export interface FeatureOptions extends HelperOptions {
    /** 
     * If a feature is cached, you can only get one instance of it. 
     * 
     * when you say container.feature('whatever', options) with the same options
     * then you'll get the same object back. Passing cached = false will circumvent
     * this behavior and give you a new object every time.
    */
    cached?: boolean;

    // Pass enable=true to automatically enable the feature 
    enable?: boolean;
}

export interface FeatureState extends HelperState { 
    enabled: boolean;
}

export abstract class Feature<T extends FeatureState = FeatureState, K extends FeatureOptions = FeatureOptions> extends Helper<T, K> {
    get shortcut() {
        return camelCase(kebabCase(this.constructor.name.replace(/^_/,'')))
    }

    get isEnabled() {
        return this.state.get('enabled')
    }    
   
    constructor(options: K, context: ContainerContext) {
        super(options, context)

        if(typeof context.container !== 'object') {
            console.error(this, options, context)
            throw new Error('You should not instantiate a feature directly. Use container.feature() instead.')
        }


        if(options?.enable) {
          this.enable()
        }
    }

    /** 
     * For features where there only needs to be a single instance, you
     * can use this method to attach the feature to the container.
    */
    protected attachToContainer() {
        Object.defineProperty(this.container, this.shortcut, {
            get: () => this
        })        
    }

    async enable(options: any = {}) : Promise<this> {
        this.attachToContainer()
        this.emit('enabled')
        this.state.set('enabled', true)
        
        this.container.emit('featureEnabled', this.shortcut, this)

        return this
    }
}

export class FeaturesRegistry extends Registry<Feature<any, any>> { }

export const features = new FeaturesRegistry()