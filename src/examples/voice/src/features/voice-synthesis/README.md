import VocalProgressBar from '../../components/VocalProgressBar'

# Voice Synthesis Demo

It is possible to make your webapp speak out loud to you.

## Saying Something

The following function will instruct your browser (if it supports this feature) to speak outloud

```javascript name=saySomething editable=true 
function say(something) {
  something = something && something.length && something || 'Your boy sodapop is a motherfuckin champ'
  const synth = window.speechSynthesis
  const voice = rando(english)
  const howItSounds = new SpeechSynthesisUtterance(`My name is ${voice.name}....and I am here, to say: ... ${something}`) 

  howItSounds.voice = voice  
  speechSynthesis.speak(howItSounds)

  return something
}

const voices = window.speechSynthesis
  ? window.speechSynthesis.getVoices()
  : [] 

const only = (lang) => voices.filter((voice) => voice.lang.startsWith(lang))

const rando = (set = voices) => 
  set[ Math.floor(Math.random() * (set.length - 1))]

const italian = only('it') 
const english = only('en')
const spanish = only('es')
const anybody = () => rando([
  ...english,
  ...spanish,
  ...italian
]) 
```

Feel free to edit the above code.  

Whatever you enter into the field below will run `window.say("whatever you type")` using the `say` function defined above.

[What should I say?](doc://prompts/input?name=whatToSay)

## Building a Voice Synthesis Feature

Given that 

- the Speech Synthesis APIs may not be supported in all browsers, or disabled for some other reason
- Speech engines are usually configured at runtime, with values that can only be known at runtime (user's locale, user's voice preference, etc) 
- making an app speak with javascript can be accomplished using different technologies besides the WebSpeech apis in different platforms (web, native, server, electron, etc)
- voice capabilities are just tools, and different apps will use them or not use them in completely different ways 

Speech Synthesis works very well as a Skypager Feature module, because you write this in any application, script, module: 

```javascript
import runtime from 'skypager'

const voice = runtime.feature('voice-synthesis')

if (voice.isSupported) {
  voice.enable()
}

function announce(something) {
  voice.say(something)
}
```

And if it is supported, you'll be able to make the computer (web browser, operating system) speak outloud.

Under the hood, the skypager runtime gives you the tools you need to provide this simple interface to your applications
in a universal way, but handle it specifically based on the current running javascript environment behind the scenes.

Take a look at this hypothetical runtime module, it already has a bunch of other features.  

```javascript
import runtime from '@skypager/runtime'
import auth from 'features/authentication' 
import permissions from 'features/permissions'
import paymentProcessing from 'features/paymentProcessing'
import userPreferences from 'features/UserPreferences'

export default runtime
  .use(authentication, { provider: 'aws' })
  .use(permissions)
  .use(userPreferences)
  .use(paymentProcessing, { provider: 'stripe' })
```

This module, written once, cached long term, can already power thousands of different web applications.  
We're going to make it even more powerful by adding a voice feature add-on.

## Introduction to Skypager Features 

We can define any Skypager Feature as a class that extends Feature, or as a plain object that contains simple functions.  

When written as a Class, a Feature can feel like a React Component in a lot of ways.

```javascript
class MyFeature extends Feature {
  static isObservable = true

  initialState = {
    active: false
  }

  get isSupported() {

  }

  get isTurnedOn() {
    return this.state.get('active')
  }

  // lifecycle hooks automatically called for you
  featureWasEnabled() { }
  stateDidChange() { }
}
```

When written as functions, a Feature can be written in a purely functional style, and rely on the `runtime` and other things to be passed as part of a final context argument.

```javascript
export const isObservable = true

export const observables = (options = {}, context = {}) => {
  const { runtime } = context 

  return {
    items: ["shallowMap", runtime.db.loadItemsSync()]   
  }
}

export const say(something, { runtime, feature, lodash, mobx }) => {
  if (runtime.isNode) {
    // shell out
  } else if (runtime.isBrowser) {
    // use the browser apis
  }
}
```

Since a feature can be observable, have state, and emit events, you might also like being able to refer to `this`

```javascript
export function getVoices() {
  const { runtime } = this

  if (runtime.isNode && runtime.isMac) {
    return runtime.proc.execSync(`say --list-voices`).toString()
  } else if (runtime.isBrowser) {
    return window.speechSynthesis.getVoices()
  } 
}

export function say(something, voice) {
  const { runtime } = this  

  if (runtime.isNode && runtime.isMac) {
    return runtime.proc.execSync(`say ${something} --voice ${voice}`).toString()
  } else if (runtime.isBrowser) {
    return window.speechSynthesis.speak(something)
  }
}
```

Whatever style you prefer, Features are a great way of packaging up and providing a module that offers a universal common API on top of the many different things you can do in JavaScript.

They can have observable state, they can emit events, they can implement any mobx observable property, they can use any lodash method 

All without depending on anything but `@skypager/runtime`, which in the browser is available as `window.runtime` and can be loaded from a CDN and even cached with a service worker.

This makes them great for re-use across multiple projects.

### A Voice Synthesis Feature

```javascript runnable=false module=features/voice-synthesis
import { Feature } from '@skypager/runtime'

export default class SpeechSynthesis extends Feature {
  static shortcut = 'synth'
  static isObservable = true
  static isCacheable = true

  initialState = {
    voicesAvailable: false,
    activated: false,
  }

  featureWasEnabled(settings = {}) {
    if (settings.speechSynthesis) {
      this.speechSynthesis = settings.speechSynthesis
    }

    if (settings.SpeechSynthesisUtterance) {
      this.SpeechSynthesisUtterance = settings.SpeechSynthesisUtterance
    }

    this.state.set('activated', settings.active !== false)

    this.speechSynthesis.onvoiceschanged = () => {
      try {
        this.loadVoices()
      } catch (error) {}
    }
  }

  get isActivated() {
    return !!(this.runtime.featureIsEnabled('voice-synthesis') && this.state.get('activated'))
  }

  /**
   * The feature is only supported if the apis are available or have been injected
   */
  get isSupported() {
    const { isFunction } = this.lodash

    const {
      // make these dependencies injectable
      speechSynthesis = this.runtime.get('speechSynthesis', window.speechSynthesis),
      SpeechSynthesisUtterance = this.runtime.get(
        'SpeechSynthesisUtterance',
        window.SpeechSynthesisUtterance
      ),
    } = this.options

    if (!speechSynthesis || !SpeechSynthesisUtterance) {
      // not available
      return false
    }

    if (!isFunction(speechSynthesis.speak) || !isFunction(speechSynthesis.getVoices)) {
      // apis arent as we expect
      return false
    }

    return true
  }

  /**
   * This hook will get called when the program says
   *
   * runtime.feature('voice-synthesis').enable()
   *
   * You can inject your own `speechSynthesis` and `SpeechSynthesisUtterance` if they're not available in the window scope
   */
  initialize() {
    const {
      speechSynthesis = this.runtime.speechSynthesis || window.speechSynthesis,
      SpeechSynthesisUtterance = this.runtime.SpeechSynthesisUtterance ||
        window.SpeechSynthesisUtterance,
    } = this.options

    if (speechSynthesis) {
      this.speechSynthesis = speechSynthesis
    }

    if (SpeechSynthesisUtterance) {
      this.SpeechSynthesisUtterance = SpeechSynthesisUtterance
    }
  }

  get voices() {
    const { keyBy } = this.lodash
    const { voices = [] } = this.currentState

    if (voices.length) {
      return keyBy(voices, v => v.name.toLowerCase())
    }

    const fetched = this.loadVoices()
    return keyBy(fetched, v => v.name.toLowerCase())
  }

  loadVoices() {
    if (!this.speechSynthesis) {
      console.log('no synth available')
      return []
    }

    const fetched = Array.from(this.speechSynthesis.getVoices())
    console.log('fetched', fetched)

    if (fetched[0]) {
      this.state.set('voices', fetched)
      this.state.set('voicesAvailable', true)
    }

    return fetched
  }

  /**
   * @type {Object<String, SpeechSynthesisVoice>}
   */
  get americanVoices() {
    return this.chain
      .get('voices')
      .pickBy(v => v.lang === 'en-US')
      .value()
  }

  get someRando() {
    return (
      this.chain
        .get('voices')
        .values()
        .shuffle()
        .last()
        .get('name')
        .value() || this.defaultVoice
    )
  }

  get someRandomAmerican() {
    return (
      this.chain
        .get('americanVoices')
        .values()
        .shuffle()
        .last()
        .get('name')
        .value() || this.defaultVoice
    )
  }

  /**
   * @type {SpeechSynthesisVoice}
   */
  get defaultVoice() {
    const voice = this.get('featureSettings.voice', 'alex')
    return this.voices[String(voice).toLowerCase()]
  }

  activate() {
    this.state.set('activated', true)
    return this
  }

  disable() {
    this.state.set('activated', false)
    return this
  }

  /**
   * @param {String} phrase what to say
   * @param {String|SpeechSynthesisVoice} inVoice the voice to use
   */
  say(phrase, inVoice = this.defaultVoice) {
    if (!this.state.get('activated')) {
      this.runtime.log('synth say', phrase)
      this.emit('saying', phrase)
      return
    }

    const utterance = new this.SpeechSynthesisUtterance(phrase)
    utterance.voice = typeof inVoice === 'string' ? this.voices[inVoice.toLowerCase()] : inVoice
    this.emit('saying', phrase)
    this.speechSynthesis.speak(utterance)
  }
}
```

Once you load this module, it needs to be registered with the runtime

```javascript
import runtime from '@skypager/runtime'
import VoiceSynthesis from 'features/voice-synthesis'

runtime.features.add({ 'voice-synthesis': VoiceSynthesis })

export default runtime
```

and then it can be accessed in your application

```javascript
const voice = runtime.feature('voice-synthesis')
```

## Build a Vocal Progress Bar

Lets actually use the feature now.

We're going to build a progress bar that talks to us.

<VocalProgressBar progressInterval={450} />

```javascript module=components/VocalProgressBar runnable=false name=vocalProgress
import React, { Component } from 'react'
import types from 'prop-types'
import { Button, Header, Segment, Message, Progress } from 'semantic-ui-react'

export default class VocalProgressBar extends Component {
  static contextTypes = {
    runtime: types.object,
  }

  static propTypes = {
    stages: types.arrayOf(
      types.shape({
        level: types.number,
        message: types.string,
      })
    ),
  }

  static defaultProps = {
    stages: [
      {
        level: 0,
        message: 'Yes.  Get ready to burn baby.  Ready....to....burn.',
      },
      {
        level: 20,
        message: 'Nice.... baby. Twenty percent. We movin. We movin real good',
      },
      {
        level: 30,
        message: 'Dont slow down on me',
      },
      {
        level: 40,
        message: 'Already bro? you tired?',
      },
      {
        level: 50,
        message: 'Thats what im talkin bout baby. Half way there',
      },
      {
        level: 65,
        message: 'oh......my......god. Yeah Son.',
      },
      {
        level: 85,
        message: 'Who are you dawg? Who the fuck are you?',
      },
      {
        level: 100,
        message: 'Wow son. Wow. Beast. Beast mode............ as..... Fuck. ',
      },
    ],
  }

  state = {
    percent: 0,
    stages: this.props.stages,
    voice: this.props.voice || 'alex',
  }

  handleStart = () => {
    const { runtime } = this.context

    if (!runtime.isFeatureEnabled('voice-synthesis')) {
      runtime
        .feature('voice-synthesis')
        .enable()
        .then(() => {
          this.handleStart()
        })
      return
    }

    const { synth } = runtime

    this._interval = setInterval(() => {
      this.setState(
        current => ({
          ...current,
          voice: synth.randomEnglish.name.toLowerCase(),
          percent: current.percent + (Math.random() * this.props.tick || 1) + 0.1,
        }),
        () => {
          if (this.state.percent >= 100) {
            clearInterval(this._interval)
          }

          this.handleMessaging()
        }
      )
    }, this.props.progressInterval || 300)
  }

  handleMessaging = () => {
    const { runtime } = this.context

    const sayNextThing = ({ stages = [], voice }) => {
      const currentStage = stages.shift()
      const { message } = currentStage

      runtime.synth.say(message, voice)

      return {
        stages,
        message: `${voice}: ${message}`,
      }
    }

    this.setState(current => {
      const { stages, percent } = current

      const nextLevel = stages[0]

      if (nextLevel && nextLevel.level < percent) {
        return {
          ...current,
          ...sayNextThing(current),
        }
      } else {
        return current
      }
    })
  }

  componentWillUnmount() {
    this._interval && clearInterval(this._interval)
  }

  render() {
    const { started } = this.state

    return (
      <Segment>
        <Header as="h3" content="Progress" dividing />
        {!started && (
          <Button
            huge
            content="Lets start!"
            onClick={() => {
              this.setState({ started: true }, () => this.handleStart())
            }}
          />
        )}
        {started && <Progress percent={this.state.percent} indicating />}
        {started && (
          <Segment secondary>
            {this.state.message && <Message content={this.state.message} />}
          </Segment>
        )}
      </Segment>
    )
  }
}
```


## Table of Contents

- [Building the Voice Synthesis Feature](/synthesis)
- [Building the Speech Recognition Feature](/recognition)
- [Combining Features to do something Awesome](/commander)
- Further Reading
  - [Web Speech API Specification](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis)

