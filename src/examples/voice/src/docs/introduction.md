import VocalProgressBar from '../components/VocalProgressBar'

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

This tutorial will cover how to build a component like this one, with React

<VocalProgressBar progresInterval={450} />

## Table of Contents

- [Web Speech API Specification](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis)
- [Building the Voice Synthesis Feature](/synthesis)
- [Building the Speech Recognition Feature](/recognition)