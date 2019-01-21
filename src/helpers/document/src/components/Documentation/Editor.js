import PropTypes from 'prop-types'
import React from 'react'
import AceEditor from 'react-ace'
import ace from 'brace' // eslint-disable-line
import 'brace/ext/language_tools'
import 'brace/mode/jsx'
import 'brace/mode/css'
import 'brace/mode/markdown'
import 'brace/mode/javascript'
import 'brace/mode/sh'
import 'brace/mode/html'
import 'brace/theme/tomorrow'
import 'brace/theme/vibrant_ink'
import 'brace/theme/dracula'

function Editor(props) {
  const { id, mode, value, ...rest } = props

  return (
    <AceEditor
      name={id}
      mode={mode}
      theme="tomorrow"
      width="100%"
      height="100px"
      value={value}
      highlightActiveLine={false}
      maxLines={Infinity}
      showGutter={false}
      showPrintMargin={false}
      tabSize={2}
      {...rest}
      style={{
        padding: '28px',
        ...(rest.style || {}),
      }}
      editorProps={{ $blockScrolling: Infinity, ...(rest.editorProps || {}) }}
    />
  )
}

Editor.propTypes = {
  id: PropTypes.string.isRequired,
  mode: PropTypes.oneOf(['html', 'jsx', 'markdown', 'css', 'javascript', 'sh']),
  value: PropTypes.string.isRequired,
}

Editor.defaultProps = {
  mode: 'jsx',
}

export default Editor
