# Commander

This demo combines the `speech-recognition` and `voice-synthesis` features to build a conversation based
assistant.

## Building The Listener

The Listener Component is responsible for listening to the microphone, and taking what it understands and adding it to a queue
to be processed as commands or instructions for the bot.

Play with the example below, the code will be beneath it.

```javascript renderable=true position=above
function Listener() {
  const [transcript, updateTranscript] = useState('')
  const [speechEnabled, updateSpeechEnabled] = useState($runtime.isFeatureEnabled('speech-recognition'))
  const speech = $runtime.feature('speech-recognition')  
  const [listening, updateListening] = useState(speech.isListening)

  const enableSpeech = async () => {
    await speech.enable()
    updateSpeechEnabled(true)
  }

  let abort

  const beginListening = async () => {
    if (speech.isListening && abort) {
      abort()  
      abort = undefined
      return
    }

    abort = speech.listen({
      transcriptId: $runtime.lodash.uniqueId('transcript'),
      onComplete: (complete) => {
        if (String(complete).toLowerCase().match(/stop listening/)) {
          abort && abort()  
          speech.stop()
          updateListening(false)
        }

        updateTranscript(complete)
      }
    })

    updateListening(true)
  }

  if (!speechEnabled) {
    return (
      <Segment>
        <Button content="Enable Speech Recognition" onClick={enableSpeech} />
      </Segment>
    )
  }

  if (!listening) {
    return (
      <Segment>
        <Button content="Start Listening" onClick={beginListening} />
        {transcript && transcript.length && <Header as="h4" dividing content="Previous Transcript" />}
        {transcript && transcript.length && <Message>{transcript}</Message>}
      </Segment>
    )
  }

  if (listening) {
    return (
      <Segment>
        <Header dividing content='Currently Listening...' />
        <p>Say <strong>"Stop listening"</strong> to stop.</p>
        <pre>
          {transcript}
        </pre>
      </Segment>
    )
  }
}

<Listener />
```

In this example, we built a component which is capable of enabling the speech recognition feature, starting a speaking session, and handling the transcript.

We use the `onComplete` event handler when listening, and if the user says "STOP LISTENING" we stop.

To build the `Commander Bot` we will need to be able to recognize speech as a set of distinct commands,
and to give the system time to react to commands in the order they are received, when ever the system is ready to receive a command. 

In the Listener component example, our function that starts the listening looks like

```javascript
  const beginListening = async () => {
    if (speech.isListening && abort) {
      abort()  
      abort = undefined
      return
    }

    abort = speech.listen({
      transcriptId: $runtime.lodash.uniqueId('transcript'),
      onComplete: (complete) => {
        if (String(complete).toLowerCase().match(/stop listening/)) {
          abort && abort()  
          speech.stop()
          updateListening(false)
        }

        updateTranscript(complete)
      }
    })

    updateListening(true)
  }
```

Each time we listen, we set a unique transcript id.

The speech recognition feature uses the mobx observable shallow map to record transcripts for each transcript id.

So we can observe `runtime.speech.transcripts` and react every time there is a value.

We'll use the `useEffect` hook to keep track of each transcript individually


```javascript renderable=true position=above
function CommandListener({ onStop }) {
  const [transcripts, updateTranscripts] = useState({})
  
  useEffect(() => 
    $runtime.state.observe(({ name, newValue }) => {
      if (name === 'transcripts') {
        updateTranscripts(newValue)
      }
    })
  )

  const stopListening = () => {
    $runtime.speech.stop(); 
    $runtime.setState({ transcripts: {} }, () => updateTranscripts({}))
    onStop()
  }

  return (
    <div>
      <Button content="Stop Listening" onClick={stopListening}/>
      {Object.entries(transcripts).map(([transcriptId, content]) => <div key={transcriptId}><strong>{transcriptId} {content.timestamp}</strong><p>{content.command}</p></div>)}
    </div>
  )
}

class ListenerSystem extends Component {
  async componentDidMount() {
    if (!$runtime.isFeatureEnabled('speech-recognition')) {
      await $runtime.feature('speech-recognition').enable()
    }  
  }

  state = {
    listening: false,
    transcripts: {}
  }

  async listen() {
    const { speech } = $runtime
    
    let previousTranscript = ''

    this.abort = speech.listen({
      onComplete: (transcript) => {
        $runtime.setState((current) => Object.assign({}, current, {
          transcripts: Object.assign({}, current.transcripts, {}, {
            [$runtime.lodash.uniqueId('transcript')]: {
              command: Object.values(current.transcripts || {}).reduce((memo, partial) =>  memo.replace(partial.command, ''), transcript),
              timestamp: Date.now()
            }
          })
        }), () => previousTranscript = transcript)
      }
    })    

    this.setState({ listening: true })
  }

  render() {
    const { listening } = this.state
    
    if (!listening) {
      return (
        <Button content="Start" onClick={() => this.listen()} />
      )
    }

    return <CommandListener onStop={() => this.setState({ listening: false })} /> 
  }
}

<ListenerSystem />
```

With the above example, we're able to track each individual command in the order that it was received.

We need to be able to react to each command as it is received, and allow for a back and forth interaction. 

In the component below, when you click on Start, it starts the `listen` method on the speech recognition feature.

It will wait for pauses, and treat each spoken statement as a unique command.

Each unique command gets processed with the NLP Library [Compromise](https://github.com/spencermountain/compromise) so not only do we have the command,
but we have information about each command:

- what are the verbs
- what are the nouns
- what are the values (e.g. 1 month, 5 dollars)

```javascript renderable=true position=above
function CommandHistory({ listening }) {
  const [transcripts, updateTranscripts] = useState({})
  const [expanded, updateExpanded] = useState({})

  useEffect(() => {
    $runtime.state.observe(({ name, newValue }) => updateTranscripts(newValue))
  })

  const items = Object.entries(transcripts)

  return (
    <Segment>
      <Segment attached="top">
        <Header color={listening ? 'red' : 'black'} dividing as="h3" content="Responder System" onClick={() => listening && $runtime.speech.stop()}/>
      </Segment>
      {!!items.length && <Segment secondary>
      {!!items.length && items.map((item) => {
        const [transcriptId, data] = item

        return (
          <Segment key={transcriptId}>
            <Header onClick={() => updateExpanded({ ...expanded, [transcriptId]: !expanded[transcriptId]})} icon={expanded[transcriptId] ? 'folder open' : 'folder'} as="h4" content={data.command} />
            {expanded[transcriptId] && <pre>
              {JSON.stringify($runtime.lodash.omit(data, 'command'), null, 2)}
            </pre>}
          </Segment>
        )
      })}
      </Segment>}
    </Segment>
  )
}

class ResponderSystem extends Component {
  async componentDidMount() {
    if (!$runtime.isFeatureEnabled('speech-recognition')) {
      await $runtime.feature('speech-recognition').enable()
    }  

    const { Zdog, nlp } = await $runtime.assetLoader.unpkg({
      nlp: 'compromise@latest/builds/compromise.min.js',
    })

    this.nlp = nlp
  }

  state = {
    listening: false,
    transcripts: {}
  }

  async listen(tapFn) {
    const { speech } = $runtime

    const process = (command) => {
      const parser = this.nlp(command)  

      const isQuestion = !!parser.sentences().isQuestion().length

      const nouns = parser.nouns().data()
      const verbs = parser.verbs().data()
      const values = parser.values().data()

      const infinitives = verbs
        .filter(({ normal }) => String(normal).toLowerCase() !== "let's")
        .map(({ conjugations }) => conjugations.Infinitive)

      const data = {
        command,
        isQuestion,
        nouns,
        verbs,
        values,
        structured: infinitives.concat(nouns.map(n => n.normal)) 
      }

      if (typeof tapFn === 'function') {
        return tapFn(data)
      } else {
        return data
      }

    }

    this.abort = speech.listen({
      clear: true,
      onComplete: (transcript) => {
        const commandData = process(transcript)

        if (commandData.command && commandData.command.match(/stop.*listening/i)) {
          this.abort()
          this.setState({ listening: false })
        }

        $runtime.setState((current) => Object.assign({}, current, {
          transcripts: Object.assign({}, current.transcripts, {}, {
            [$runtime.lodash.uniqueId('transcript')]: {
              ...commandData,
              timestamp: Date.now()
            }
          })
        }))
      }
    })    

    this.setState({ listening: true })
  }

  render() {
    const { listening } = this.state
    
    if (!listening) {
      return (
        <Segment>
          <Header dividing content="Responder System" />
          <Button content="Start" onClick={() => this.listen()} />
        </Segment>
      )
    }

    return (
      <CommandHistory 
        listening={this.state.listening} 
        nlp={this.nlp} 
        onStop={() => this.setState({ listening: false })} 
      /> 
    )
  }
}

<ResponderSystem />
```

## Next Steps

So we've just demo'd how to build a React component which interacts with the speech recognition feature, to build a React component
which has access to spoken commands, as well as useful metadata about the each command.

The next step will be combining these capabilities, to support the stateful, asynchronous processing of commands in order.

So for example if I say 

- Show me my projects 
- Lets just see the webapps
- Which ones have changed in the past two weeks?
- Let's look at the screenshots
- Ok lets deploy them to a preview URL

I should see a different view after each command, and it should adapt to what I am saying.

[Next Page](/commander-tutorial)

## Table of Contents

- [Building the Voice Synthesis Feature](/synthesis)
- [Building the Speech Recognition Feature](/recognition)
- [Combining Features to do something Awesome](/commander)
- Further Reading
  - [Web Speech API Specification](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis)
