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
