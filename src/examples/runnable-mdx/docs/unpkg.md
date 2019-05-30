# Unpkg Demo

This demo uses [unpkg](https://unpkg.com) to provide your document with dependencies from npm.

## Defining Imports 

We wil need to define a section called imports, so that the document helper can identify the following list element,
and use it to extract the necessary pieces of information we need about the dependencies we're pulling from npm.

We need to know the `global variable name` and the path to the module on `unpkg.com`. 

For example, the following markdown list can convey the information

```markdown

## Imports

- [React](react@16.8.6/umd/react.development.js)
- [ReactDOM](react-dom@16.8.6/umd/react-dom.development.js)
```

## Imports

We're going to be loading the [Zdog](https://zzz.dog) library for working with svg and canvas.

- [Zdog](zdog@1.0.1/dist/zdog.dist.min.js)

Under the hood, the Document helper component can detect the list element under the imports heading,
and process each item to extract the arguments it needs to be able to load these libraries for us prior to rendering
the examples on the page itself.  

## Using our imported dependency 

As you can see, our renderable block won't display until the dependencies have been imported.

```javascript renderable=true
typeof Zdog
```

Any dependencies imported this way will be automatically in scope in your code blocks.

You can also use them in require statements

```javascript renderable=true
const React = require('react')
const Zdog = require('zdog')
const { Component } = React

class Imported extends Component {
  render() {
    return typeof Zdog === 'undefined'  
      ? <div>'Oh no!</div>
      : <div>even imports work</div>
  }
}

<Imported />
```

As well as import statements

```javascript renderable=true
import Zdog from 'zdog'

function Z() {
  return <div>typeof Zdog is {typeof Zdog}</div>
}

<Z />
```

and it will still be resolved by the global variable, since the dependencies are loaded via a script tag.

regardless, this makes your code examples more copy paste friendly between the documentation and the real code!

## Zdog Demo

Just by loading this markdown file in the skypager runtime, with the @skypager/helpers-document plugin,
we can write code demos and tutorials with dependencies from NPM. 

```javascript renderable=true
class Illustration extends Component {
  renderIllustration() {

    // create illo
    const illo = new Zdog.Illustration({
      // set canvas with selector
      element: '.zdog-canvas',
    })
    
    // add circle
    new Zdog.Ellipse({
      addTo: illo,
      diameter: 80,
      stroke: 20,
      color: '#636',
    })
    
    // update & render
    illo.updateRenderGraph()
  }

  componentDidMount() {
    this.renderIllustration()
  }

  render() {
    return (
      <Container textAlign="center">
        <canvas 
          className="zdog-canvas"
          width={240}
          height={240}
          style={{ backgroundColor: 'pink' }}
        />
      </Container>
    )
  }
}

<Illustration />
```