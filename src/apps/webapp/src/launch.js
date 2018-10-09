import React from 'react'
import runtime from './runtime'
import App from './App'
import { AppContainer } from 'react-hot-loader'
import { render } from 'react-dom'

const renderer = Component => {
  render(
    <AppContainer>
      <Component runtime={runtime} />
    </AppContainer>,
    document.getElementById('root')
  )
}

renderer(App)

if (process.env.NODE_ENV === 'development' && module.hot) {
  module.hot.accept('./App', () => {
    renderer(App)
  })
}
