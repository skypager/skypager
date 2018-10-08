const { React, runtime, semanticUIReact, ReactDOM, ReactRouterDOM } = global
const { Header, Container, Segment, Grid } = semanticUIReact
const { render } = ReactDOM
const { Component } = React

class App extends Component {
  render() {
    return (
      <Container>
        <Header as="h1" content="Skypager" subheader="Universal JavaScript Framework" />
      </Container>
    )
  }
}

render(<App />, document.getElementById('root'))
