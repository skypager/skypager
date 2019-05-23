# Voice Synthesis Demo

It is possible to make your webapp speak out loud to you.

## Saying Something

The following function will instruct your browser (if it supports this feature) to speak outloud, in the
first available voice on your system.

```javascript runnable=false name=saySomething readOnly=true
function say(something) {
  const synth = window.speechSynthesis
  const howItSounds = new SpeechSynthesisUtterance(something) 
  howItSounds.voice = Array.from(synth.getVoices())[0]
  speechSynthesis.speak(howItSounds)

  return something
}
```

[What should I say?](doc://prompt?name=whatToSay)
[Say Something](doc://run?block=saySomething&phrase=whatToSay)

## Building a Voice Synthesis Feature

[Read the Web Speech Browser Specification](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis)

Given that 

- the Speech Synthesis APIs may not be supported in all browsers, or disabled for some other reason
- Speech engines are usually configured at runtime, with values that can only be known at runtime (user's locale, user's voice preference, etc) 
- making an app speak with javascript can be accomplished using different technologies besides the WebSpeech apis in different platforms (web, native, server, electron, etc)

Speech Synthesis is a perfect candidate for a [Skypager Feature](../../runtime/src/feature.js)

### Defining The Feature

We can define a Skypager Feature as a class that extends Feature.


The Feature class describes some functional interface on top of a capability you want your application to have.

```javascript runnable=false module=features/voice-synthesis
import runtime from '@skypager/runtime'
import { Feature } from '@skypager/runtime'

export default class SpeechSynthesis extends Feature {

  /**
   * The feature is only supported if the apis are available or have been injected
  */
  get isSupported() {
    const { isFunction } = this.lodash

    const { 
      // make these dependencies injectable
      speechSynthesis = this.runtime.speechSynthesis, 
      SpeechSynthesisUtterance = this.runtime.SpeechSynthesisUtterance 
    } = this.options

    if (!speechSynthesis || !SpeechSynthesisUtterance) {
      // not available 
      return false
    }

    if (!isFunction(speechSynthesis.speak) || !isFunction(speechSynthesis.getVoices)) {
      // apis arent as we expect
      return false
    }
  }

  /**
   * This hook will get called when the program says
   * 
   * runtime.feature('voice-synthesis').enable()
   * 
   * You can inject your own `speechSynthesis` and `SpeechSynthesisUtterance` if they're not available in the global scope 
  */
  featureWasEnabled(options = {}) {
    const { 
      lang = 'en-US', 
      speechSynthesis = this.runtime.speechSynthesis, 
      SpeechSynthesisUtterance = this.runtime.SpeechSynthesisUtterance 
    } = { ...this.options, ...options } 

    this.speechSynthesis = speechSynthesis
    this.SpeechSynthesisUtterance = SpeechSynthesisUtterance

    const { keyBy } = this.lodash

    this.voices = keyBy(
      Array.from(speechSynthesis.getVoices()),
      ({ name }) => String(name).toLowerCase()
    ) 
  }

  /**
   * @type <Array<SpeechSynthesisVoice>> 
  */
  get americanVoices() {
    return this.chain.get('voices').pickBy((v) => v.lang === 'en-US')
  }

  /**
   * @type <SpeechSynthesisVoice> 
  */
  get defaultVoice() {
    const voice = this.get('featureSettings.voice', 'alex') 
    return 
  }

  /**
   * @param {String} phrase what to say
   * @param {String|SpeechSynthesisVoice} inVoice the voice to use
  */
  say(phrase, inVoice = this.defaultVoice) {
    const utterance = new this.SpeechSynthesisUtterance(phrase)

    utterance.voice = typeof inVoice === 'string'
      ? this.voices[inVoice.toLowerCase()]
      : inVoice

    this.speechSynthesis.speak(utterance)
  }
}
```

With this Feature Class, we can make it available to the runtime by registering it

```javascript
import runtime from '@skypager/runtime'
import VoiceSynthesis from 'features/voice-synthesis'

runtime.features.register('voice-synthesis', () => VoiceSynthesis)
```

And then in your application you san say

```javascript name=enableSpeech
const isVoiceSynthesisAvailable = runtime.features.checkKey('voice-synthesis')
const isVoiceSupported = runtime.feature('voice-synthesis').isSupported()

if (isVoiceSupported) {
  runtime.feature('voice-synthesis').enable({ 
    voice: 'Alice'
  })
}
```
