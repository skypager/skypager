import React, { Component } from 'react'
import types from 'prop-types'
import { Form, Segment, Button } from 'semantic-ui-react'

export default class SpeechStatus extends Component {
  static contextTypes = {
    runtime: types.object,
  }

  state = {
    enabled: false,
    voiceOptions: [],
    phrase: undefined,
  }

  componentDidMount() {
    this.disposer = this.props.doc.state.observe(({ name, newValue }) => {
      if (name === 'speechEnabled') {
        if (newValue) {
          this.setState({ enabled: newValue })
        }
      }
    })
  }

  componentWillUnmount() {
    this.disposer()
  }

  handleToggle = () => {
    const newValue = !this.props.doc.state.get('speechEnabled')

    if (newValue === true) {
      const voices = speechSynthesis.getVoices()
      this.props.doc.runtime
        .feature('voice-synthesis')
        .enable({
          speechSynthesis,
          SpeechSynthesisUtterance,
          voices,
        })
        .then(() => {
          this.props.doc.state.set('speechEnabled', true)
          const voiceOptions = Array.from(
            this.props.doc.runtime.feature('voice-synthesis').speechSynthesis.getVoices()
          ).map(v => ({ key: v.name, value: String(v.name).toLowerCase(), text: v.name }))

          this.setState({ voiceOptions })
        })
    }
  }

  render() {
    if (this.state.enabled) {
      return (
        <Form as={Segment}>
          <Form.Input
            label="What do you want to say?"
            type="text"
            value={this.state.phrase || ''}
            onChange={(e, { value: phrase }) => this.setState({ phrase })}
          />
          <Form.Dropdown
            selection
            value={this.state.voice || 'alex'}
            label="In Whose Voice?"
            options={this.state.voiceOptions}
            onChange={(e, { value }) => this.setState({ voice: value })}
          />
          <Form.Button
            content="Say it!"
            onClick={() =>
              this.props.doc.runtime.synth.say(
                this.state.phrase,
                String(this.state.voice).toLowerCase()
              )
            }
          />
        </Form>
      )
    } else {
      return <Button toggle content="Enable Speech Feature" onClick={this.handleToggle} />
    }
  }
}
