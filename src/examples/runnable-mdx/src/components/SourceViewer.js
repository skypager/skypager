import React, { Component } from 'react'
import types from 'prop-types'
import Editor from '@skypager/helpers-document/lib/skypager-document-editor'
import { Loader, Grid, Button, Segment, Tab } from 'semantic-ui-react'
import JsonView from 'react-json-view'
import DocRepl from './DocRepl'

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
        menuItem: { content: 'File', id: 'file-tab' },
        render: () => (
          <Tab.Pane as="div">
            <InspectJson name="fileData" data={omit(fileData, 'content')} />
          </Tab.Pane>
        ),
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
      doc && {
        active: activeIndex === 3,
        menuItem: { content: 'REPL', id: 'repl-tab' },
        render: () => (
          <Tab.Pane as="div">
            <DocRepl doc={doc} />
          </Tab.Pane>
        ),
      },
    ].filter(Boolean)

    return (
      <Tab onTabChange={this.onChange} menu={{ secondary: true, pointing: true }} panes={panes} />
    )
  }
}

export function SplitLayout(props = {}) {
  const { showInfo, lang, file, toggleInfo, value, fileData, processedMdx } = props

  const columns = showInfo
    ? [
        <CodeEditor key="code-editor" lang={lang} file={file} value={value} />,
        <FileInspector file={file} fileData={fileData} processedMdx={processedMdx} />,
      ]
    : [<CodeEditor key="code-editor" lang={lang} file={file} value={value} />]

  return (
    <Grid columns={showInfo ? 'two' : 'one'} fluid style={{ paddingRight: '12px' }}>
      <Grid.Row columns="one">
        <Grid.Column>
          <Button content="Toggle Info" onClick={toggleInfo} />
        </Grid.Column>
      </Grid.Row>
      <Grid.Row>
        {columns.map(col => (
          <Grid.Column>{col}</Grid.Column>
        ))}
      </Grid.Row>
    </Grid>
  )
}

export default class SourceViewer extends Component {
  state = {
    loading: false,
    showInfo: false,
    fileData: undefined,
    processedMdx: undefined,
    ready: false,
  }

  toggleInfo = () => {
    this.setState(c => ({ ...c, showInfo: !c.showInfo }))
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
    } finally {
      this.setState({ loading: false })
    }
  }

  render() {
    const { file } = this.props
    const { ready, fileData, processedMdx, showInfo, loading } = this.state

    if (loading || !ready || !fileData) {
      return <div />
    }

    return (
      <SplitLayout
        file={file}
        showInfo={showInfo}
        toggleInfo={this.toggleInfo}
        value={fileData.content}
        fileData={fileData}
        processedMdx={processedMdx}
      />
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

SplitLayout.propTypes = {
  file: types.string.isRequired,
  lang: types.string,
  toggleInfo: types.func,
  showInfo: types.bool,
  fileData: types.shape({
    relative: types.string,
    path: types.string,
    stats: types.shape({
      mtime: types.oneOf([types.number, types.string]),
    }),
  }),
}

SplitLayout.defaultProps = {
  lang: 'javascript',
  showInfo: false,
  fileData: {},
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
SplitLayout.contextTypes = contextTypes
FileInspector.contextTypes = contextTypes

function condense(mdxCode) {
  return String(mdxCode).replace(/export const ast.*\/\*\s\@/s, '/* @')
}
