import React, { Component } from 'react'
import types from 'prop-types'
import Editor from '@skypager/helpers-document/lib/skypager-document-editor'
import { Form, Popup, Button, Loader, Grid, Tab, Segment } from 'semantic-ui-react'
import JsonView from 'react-json-view'
import DocRepl from './DocRepl'
import ActiveDocument from './ActiveDocument'

export function Preferences({ onChange, ...values }) {
  return <Form onSubmit={e => e.preventDefault()} as={Segment} basic inverted />
}

export function InspectJson({ name, data }) {
  return <JsonView src={data} name={name} collapsed={1} />
}

export function CodeEditor(props = {}) {
  return (
    <Editor
      renderLoader={() => <Loader active />}
      debounceChangePeriod={400}
      editable
      renderable={false}
      mode="markdown"
      wrapEnabled
      id={props.id || props.name}
      {...props}
    />
  )
}

export class FileInspector extends Component {
  state = {
    activeIndex: 0,
  }

  onChange = (e, { activeIndex }) => {
    this.setState({ activeIndex })
  }

  render() {
    const { runtime } = this.context
    const { omit } = runtime.lodash
    const { file, fileData, processedMdx } = this.props
    const { activeIndex } = this.state

    const mdxData = {
      ...omit(processedMdx.parsed || {}, 'code'),
      rehypeAst: processedMdx.rehypeAst,
    }

    const doc = runtime.mdxDoc(file.replace(/docs\//, '').replace('.md', ''))

    const panes = [
      {
        active: activeIndex === 0,
        menuItem: { content: 'REPL', id: 'repl-tab' },
        render: () => <Tab.Pane as="div">{doc && <DocRepl doc={doc} />}</Tab.Pane>,
      },
      {
        active: activeIndex === 1,
        menuItem: { content: 'MDX Data', id: 'mdx-tab' },
        render: () => (
          <Tab.Pane as="div">
            <InspectJson name="processedMdx" data={mdxData} />
          </Tab.Pane>
        ),
      },
      {
        active: activeIndex === 2,
        menuItem: { content: 'MDX Code', id: 'mdx-code-tab' },
        render: () => (
          <Tab.Pane as="div">
            <CodeEditor
              editable={false}
              mode="javascript"
              value={condense(processedMdx.parsed.code)}
            />
          </Tab.Pane>
        ),
      },

      {
        active: activeIndex === 3,
        menuItem: { content: 'File', id: 'file-tab' },
        render: () => (
          <Tab.Pane as="div">
            <InspectJson name="fileData" data={omit(fileData, 'content')} />
          </Tab.Pane>
        ),
      },
      {
        active: activeIndex === 3,
        menuItem: { content: 'Rendered', id: 'render-tab' },
        render: () => (
          <Tab.Pane as="div">
            <ActiveDocument docId={doc.name} />
          </Tab.Pane>
        ),
      },
    ].filter(Boolean)

    return (
      <Tab onTabChange={this.onChange} menu={{ secondary: true, pointing: true }} panes={panes} />
    )
  }
}

export default class SourceViewer extends Component {
  state = {
    loading: false,
    fileData: undefined,
    processedMdx: undefined,
    ready: false,
    showInfo: true,
    settings: {},
  }

  async componentDidMount() {
    const { runtime } = this.context

    this.setState({ ready: runtime.currentState.docsLoaded })

    runtime.once('docsLoadedDidChangeState', () => {
      this.setState({ ready: runtime.currentState.docsLoaded })
    })

    try {
      this.setState({ loading: true })
      const fileData = await runtime.appClient.listFiles(this.props.file)
      const processedMdx = await runtime.appClient.processMdx({
        content: fileData.content,
        filename: fileData.path.replace('~', '/app'),
      })
      this.setState({ processedMdx, fileData })
    } catch (error) {
      console.error('ERROR', error)
      this.setState({ error: `Failed to load source for ${this.props.file} ${ error.message }` })
    } finally {
      this.setState({ loading: false })
    }
  }

  render() {
    const { file, lang } = this.props
    const { error, settings = {}, ready, fileData, processedMdx, loading } = this.state
    const { showInfo } = this.state

    if (error && error.length) {
      return <div>{error}</div>
    }

    if (loading || !ready || !fileData) {
      return <div />
    }

    return (
      <Grid
        columns={showInfo ? 'two' : 'one'}
        stackable
        fluid
        style={showInfo ? { paddingRight: '12px' } : {}}
      >
        <Grid.Row>
          <Grid.Column stretched style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', top: '10px', right: '20px', zIndex: 30000 }}>
              <Button.Group size="mini">
                <Button icon="save" size="mini" />
                <Popup
                  open={this.state.showPreferences}
                  onClose={() => this.setState({ showPreferences: false })}
                  onOpen={() => this.setState({ showPreferences: true })}
                  inverted
                  on="click"
                  trigger={<Button size="mini" icon="settings" circular />}
                >
                  <Preferences
                    onChange={update => {
                      this.setState(c => ({ ...c, settings: { ...c.settings, ...update } }))
                    }}
                    {...settings}
                  />
                </Popup>
                <Button
                  icon="info"
                  size="mini"
                  onClick={() => this.setState(c => ({ ...c, showInfo: !c.showInfo }))}
                />
              </Button.Group>
            </div>
            <CodeEditor
              key="code-editor"
              lang={lang}
              {...settings}
              file={file}
              value={fileData.content}
            />
            ,
          </Grid.Column>
          <Grid.Column>
            <FileInspector file={file} fileData={fileData} processedMdx={processedMdx} />,
          </Grid.Column>
        </Grid.Row>
      </Grid>
    )
  }
}

const contextTypes = {
  runtime: types.shape({
    appClient: types.shape({
      listFiles: types.func,
    }),
  }),
}

CodeEditor.propTypes = {
  file: types.string.isRequired,
  lang: types.string,
  value: types.string,
}

CodeEditor.defaultProps = {
  lang: 'javascript',
  value: '',
}

FileInspector.propTypes = {
  processedMdx: types.object,
  fileData: types.shape({
    path: types.string,
    relative: types.string,
    stats: types.object,
    content: types.string,
    hash: types.string,
  }),
}

CodeEditor.contextTypes = contextTypes
SourceViewer.contextTypes = contextTypes
FileInspector.contextTypes = contextTypes

function condense(mdxCode) {
  return String(mdxCode).replace(/export const ast.*\/\*\s\@/s, '/* @')
}
