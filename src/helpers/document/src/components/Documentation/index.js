import Heading from './Heading'
import Code from './Code'
import Editor from './Editor'
import Editable from './Editable'
import { Table } from 'semantic-ui-react'

export const MdxComponents = {
  code: props => <Code {...props} />,
  pre: props => <div {...props} />,
  inlineCode: props => (
    <code style={{ color: '#f40fac' }}>
      <em {...props} />
    </code>
  ),
  table: props => <Table celled {...props} />,
  h1: props => <Heading as="h1" {...props} />,
  h2: props => <Heading as="h2" {...props} />,
  h3: props => <Heading as="h3" {...props} />,
  h4: props => <Heading as="h4" {...props} />,
  h5: props => <Heading as="h5" {...props} />,
  h6: props => <Heading as="h6" {...props} />,
}

export const buildMdxComponents = (options = {}) => {
  const base = {
    ...MdxComponents,
  }

  if (options.editable) {
    base.code = props => <Editable {...props} editable />
  }

  if (options.p) {
    base.p = props => (
      <p
        {...props}
        style={runtime.get('currentState.paragraphStyles', {
          width: '80%',
          lineHeight: 1.8,
          fontSize: '1.2em',
        })}
      />
    )
  }

  return base
}

export { Heading, Code, Editor, Editable }
