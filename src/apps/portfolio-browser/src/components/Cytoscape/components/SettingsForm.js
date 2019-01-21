import React, { Component } from 'react'
import { Form, Container, Button, Icon } from 'semantic-ui-react'
import types from 'prop-types'
import { Slider } from 'react-semantic-ui-range'

export default class SettingsForm extends Component {
  static contextTypes = { runtime: types.object }

  static defaultProps = {
    debounce: 0,
  }

  static propTypes = {
    onUpdate: types.func.isRequired,
    layout: types.shape({
      defaults: types.object,
      fields: types.array,
    }),
  }

  state = { values: {} }

  constructor(props, context) {
    super(props, context)

    if (this.props.debounce) {
      this.handleChangePropagation = this.context.runtime.lodash.debounce(
        this.handleChangePropagation,
        this.props.debounce
      )
    }
  }

  handleChangePropagation = () => {
    this.props.onUpdate(this.state.values)
  }

  handleCheckboxChange = (e, { name, checked }) =>
    this.setState(
      {
        values: {
          ...this.state.values,
          [name]: !!checked,
        },
      },
      this.handleChangePropagation
    )

  handleSliderChange = name => value => {
    this.setState(
      {
        values: {
          ...this.state.values,
          [name]: value,
        },
      },
      this.handleChangePropagation
    )
  }

  handleFieldChange = (e, { name, value }) =>
    this.setState(
      {
        values: {
          ...this.state.values,
          [name]: value,
        },
      },
      this.handleChangePropagation
    )

  render() {
    const { layout } = this.props
    const { fields = [] } = layout

    return (
      <Form
        inverted
        onSubmit={e => e.preventDefault()}
        onChange={(...args) => {
          console.log('Form Changed', ...args)
        }}
        style={{ paddingRight: '24px', paddingLeft: '24px' }}
      >
        {fields.map((field, key) => {
          switch (field.type) {
            case 'Dropdown':
              return (
                <Form.Field key={key}>
                  <Form.Dropdown
                    selection
                    name={field.name}
                    value={this.state.values[field.name]}
                    label={field.label}
                    options={field.options}
                    onChange={this.handleFieldChange}
                    {...field}
                  />
                </Form.Field>
              )
            case 'Slider':
              return (
                <Form.Field key={key}>
                  <label>{field.label}</label>
                  <Slider
                    name={field.name}
                    value={this.state.values[field.name]}
                    settings={{
                      min: field.min || 0,
                      max: field.max || 100,
                      step: field.step || 1,
                      onChange: this.handleSliderChange(field.name),
                    }}
                  />
                </Form.Field>
              )

            case 'Checkbox':
              return (
                <Form.Field key={key}>
                  <Form.Checkbox
                    name={field.name}
                    onChange={this.handleCheckboxChange}
                    label={field.label}
                    checked={!!this.state.values[field.name]}
                    {...field.props || {}}
                  />
                </Form.Field>
              )
            case 'Text':
            default:
              return (
                <Form.Field key={key}>
                  <Form.Input
                    name={field.name}
                    onChange={this.handleFieldChange}
                    value={this.state.values[field.name]}
                    label={field.label}
                    {...field.props || {}}
                  />
                </Form.Field>
              )
          }
        })}
      </Form>
    )
  }
}
