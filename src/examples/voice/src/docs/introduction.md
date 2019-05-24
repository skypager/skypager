import VocalProgressBar from '../components/VocalProgressBar'
import Dictation from '../features/speech-recognition/Dictation'

# Skypager Voice Runtime

Combine native browser APIs for speech recognition (speech to text) and speech synthesis (text to speech) to build a framework for speech powered applications. 

This tutorial will cover how you can build a module like this:

```javascript
import SpeechRecognition from 'features/speech-recognition'
import VoiceSynthesis from 'features/voice-synthesis'

export function attach(runtime) {
  runtime.features.add({
    'speech-recognition': () => SpeechRecognition,
    'voice-synthesis': () => VoiceSynthesis
  })
}
```

and re-use it in any application that needs to talk or be heard. 

This tutorial will cover how to build a component like this one, with React, which uses the speech synthesis APIs

<VocalProgressBar progresInterval={450} />

And because anyone or anything who only talks and never listens gets old after a while, this tutorial will cover how to develop
a component like this one, which can transcribe what you say.

<Dictation />

## Table of Contents

- [Web Speech API Specification](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis)
- [Building the Voice Synthesis Feature](/synthesis)
- [Building the Speech Recognition Feature](/recognition)