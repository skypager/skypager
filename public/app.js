const { React, runtime, semanticUIReact, ReactDOM, ReactRouterDOM } = global
const { Container, Segment, Grid } = semanticUIReact
const { render } = ReactDOM
const { Component } = React

class App extends Component {
  render() {
    return (
      <Container>
        <Grid as={Segment} piled columns="two">
          <Grid.Column>Alpha</Grid.Column>
          <Grid.Column>Bravo</Grid.Column>
        </Grid>
      </Container>
    )
  }
}

render(<App />, document.getElementById('root'))
