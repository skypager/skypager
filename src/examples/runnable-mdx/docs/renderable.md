# Renderable Codeblocks

Code blocks that contain JSX can be rendered along side the code sample.

```javascript renderable=true 
<Segment raised style={{ marginTop: '48px' }}>
  <Header as="h2" dividing content="Renderable CodeBlocks" />
  <Message success>
    Successfully rendered the block.
  </Message>
</Segment>
```

These script blocks transpiled with @babel/standalone, and evaluated inside of a Skypager VM sandbox.  

In the block above, the `Segment` `Header` and `React` variables need to be defined in the sandbox.

## Injecting Globals into the Code Block Examples

Auto defeining globals such as `React`, `Component` in all of the renderable code blocks can help you keep example component code short and sweet.

This can be done in a couple of ways:

- through the Mdx components property in the React app itself

```javascript editable=false
<Mdx 
  components={{ 
    code: (props) => 
      <Editor sandbox={globals} {...props} />}} 
/>
```

- by using the named sandboxes feature of `@skypager/helpers-document` 

```javascript
import runtime from '@skypager/runtime'
import DocumentHelper from '@skypager/helpers-document'
import React, { Component, useState } from 'react'

runtime.use(DocumentHelper, {
  sandboxes: {
    main: () => Object.assign({}, require('semantic-ui-react'), { React, Component, useState }) 
  }
})
```

You can define sandboxes, and then in your markdown you can make sure your examples use them 
either by using the meta export, YAML frontmatter

```markdown
---
sandbox: main
---

# All these examples have main sandbox as their global

```

Or by including `sandbox=main` after the javascript syntax identifier in the renderable fenced code block. 

```javascript renderable=true
function BossComponent({ children }) {
  const [value, setValue] = useState(0)
  return (
    <div>
      <Button content={`Increment: ${value}`} onClick={() => setValue(value + 1)} />
      {children}
    </div>
  )
}

<BossComponent>
  <Segment>
    <Icon name="rocket" />  
  </Segment>
</BossComponent>
```

## Positioning Examples

You can control positioning with the `position=above|below|left|right` attribute in the language identifier of your code block.

### Above

```javascript renderable=true position=above minLines=6
<Button size="huge" color="pink" content="I am above my code" />
```

### Left  

```javascript renderable=true position=left minLines=6
<Button size="huge" color="purple" content="I am to the left of my code" />
```

### Right 

```javascript renderable=true position=right minLines=6
<Container style={{ width: '80%' }}>
  <Button 
    size="huge" 
    color="orange" 
    content="I am to the right of my code" 
  />
</Container>
```

### Below 

```javascript renderable=true position=below minLines=6
<Button size="huge" color="red" content="I am beneath my code" />
```

## Document Context & State 

Renderable codeblocks will have a global `$doc` variable which represents the `@skypager/helpers-document` mdx instance of the markdown file itself.

This `$doc` singleton can be used to share state between the different code blocks, and can even be used with hooks. 

```javascript renderable=true
function DocReporter({ doc }) {
  return (
    <Segment>
      <Header content={doc.title} dividing icon="rocket" />
      <p>The doc variable is the MDX helper class instance for this document.</p>
      <p>State Variables</p>
      <ul>
        {doc.state.keys().map((key) => <li key={key}>{key}</li>)}
      </ul>
      <p>Option keys</p>
      <ul>
        {Object.keys(doc.options).map((key) => <li key={key}>{key}</li>)}
      </ul>     
      <p>Provider keys</p>
      <ul>
        {Object.keys(doc.provider).map((key) => <li key={key}>{key}</li>)}
      </ul>         
    </Segment>
  )
}

<DocReporter doc={$doc} />
```

well

```javascript renderable=true
<div>wtf</div>
```