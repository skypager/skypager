import React, { Component } from 'react'
import types from 'prop-types'
import { TextArea, Segment, Message, Button, Header } from 'semantic-ui-react'

export default class Dictation extends Component {
  static contextTypes = {
    runtime: types.object,
  }

  state = {
    active: false,
    enabled: false,
    supported: undefined,
    status: 'Not Listening.',
    transcripts: {},
  }

  componentDidMount() {
    const { runtime } = this.context
    const recognition = runtime.feature('speech-recognition')

    this.setState({
      enabled: runtime.isFeatureEnabled('speech-recognition'),
      supported: recognition.isSupported,
      active: recognition.isActivated && recognition.isListening,
    })

    this.disposer = recognition.transcripts.observe(({ name, newValue }) => {
      this.setState(current => ({
        ...current,
        transcripts: {
          ...current.transcripts,
          [name]: newValue,
        },
      }))
    })
  }

  componentWillUnmount() {
    this.disposer && this.disposer()
  }

  handleEnable = () => {
    const { runtime } = this.context

    runtime.feature('speech-recognition').enable()

    this.setState({
      enabled: true,
    })
  }

  handleToggle = () => {
    const { runtime } = this.context
    const { speech } = runtime
    const { isFunction, uniqueId } = runtime.lodash

    if (speech.isListening) {
      speech.stop()
    }

    if (isFunction(this.abortListening)) {
      this.abortListening()
      delete this.abortListening
      console.log('stopped listening')
      this.setState({ listening: false })
      return
    }

    if (speech) {
      this.setState({ listening: true })
      this.abortListening = speech.listen({
        transcriptId: uniqueId('demo'),
        onEvent: () => this.setState({ listening: true }),
        onComplete: transcript => {
          if (transcript && transcript.length) {
            this.setState({ transcript })
          }
        },
      })
    }
  }

  render() {
    const { transcripts = {}, enabled, listening, supported, status } = this.state

    const availableTranscripts = Object.keys(transcripts)
    const clickMessage = listening ? 'Stop Listening' : 'Start Listening'

    if (typeof supported === 'undefined') {
      return null
    } else if (supported === false) {
      return (
        <Segment>
          <Message error content="Voice Recognition is not supported by this browser." />
        </Segment>
      )
    } else if (!enabled) {
      return (
        <Button
          color="purple"
          size="huge"
          content="Enable Speech Recognition"
          onClick={this.handleEnable}
        />
      )
    } else {
      return (
        <Segment basic>
          <Segment clearing>
            <Header
              subheader={`Current status: ${status}`}
              icon="microphone"
              floated="left"
              as="h2"
              content="Dictation Machine"
            />
            <Button
              color={listening ? 'red' : 'green'}
              content={clickMessage}
              floated="right"
              onClick={this.handleToggle}
            />
          </Segment>
          {availableTranscripts
            .filter(id => transcripts[id] && transcripts[id].length)
            .map(id => (
              <Message info key={id}>
                {transcripts[id]}
              </Message>
            ))}
        </Segment>
      )
    }
  }
}
