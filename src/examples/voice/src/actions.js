import React, { useState, Fragment } from 'react'
import { Button, Input, Message } from 'semantic-ui-react'

export function inputPrompt(params, { doc }) {
  switch (params.name) {
    case 'whatToSay':
      return <SayPrompt {...params} {...params.props} doc={doc} />
    default:
      return <GenericPrompt {...params} {...params.props} doc={doc} />
  }
}

export function attach(runtime) {
  runtime.mdxDocs.actions.add({
    'prompts/input': inputPrompt,
  })
}

function GenericPrompt({ defaultValue = '', name, children, doc }) {
  const [value, setValue] = useState(defaultValue)

  return (
    <Input
      fluid
      type="text"
      name={name}
      value={value}
      onChange={(e, data) => {
        setValue(data.value)
      }}
      placeholder={children}
    />
  )
}

function SayPrompt({ defaultValue = '', children, doc }) {
  const [value, setValue] = useState(defaultValue)
  const [errorMessage, setErrorMessage] = useState(false)

  const runSayBlock = phrase => {
    const whatToSayBlock = doc.body.find(
      ({ type, meta = '' }) => type === 'code' && meta.match(/name.*saySomething/)
    )

    if (whatToSayBlock) {
      const value = doc.blockContent.get(whatToSayBlock.position.start.line)
      try {
        eval(`${value}; say(${JSON.stringify(phrase)})`)
      } catch (error) {
        setErrorMessage(error.message)
        console.error(error)
      }
    }
  }

  return (
    <Fragment>
      {errorMessage && <Message error>{errorMessage}</Message>}
      <Input
        fluid
        type="text"
        name="whatToSay"
        value={value}
        onChange={(e, data) => {
          setValue(data.value)
          doc.state.set('whatToSay', data.value)
        }}
        labelPosition="right"
        placeholder={children}
        label={<Button content="Say it" onClick={() => runSayBlock(value)} />}
      />
    </Fragment>
  )
}
