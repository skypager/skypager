# Voice Synthesis Demo

It is possible to make your webapp speak out loud to you.

## Say Something

```javascript runnable=true name=saySomething
function say(something) {
  const synth = speechSynthesis
  const howItSounds = new SpeechSynthesisUtterance(something) 
  howItSounds.voice = Array.from(synth.getVoices())[0]
  return speechSynthesis.speak(howItSounds)
}
```
