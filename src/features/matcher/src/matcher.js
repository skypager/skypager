import micromatch from 'micromatch'
import { Feature } from '@skypager/runtime/lib/feature'

export default class MatcherFeature extends Feature {
  shortcut = 'matcher'

  micro = micromatch

  makeRe = micromatch.makeRe
}
