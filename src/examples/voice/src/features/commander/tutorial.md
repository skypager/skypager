# Commander Tutorial 

We developed the [Voice Synthesis Feature](/synthesis) and the  [Speech Recognition](/recognition) features as standalone modules which could be enabled if supported.

In the [Previous Section](/commander) we showed how the speech recognition feature could be hooked up to React, so we could work with speech recognition data as state and events. 

We will put it all together to create a `VoiceCommander` feature which combines these two features, to build a system which you can have a conversation with.  

```javascript renderable=true includeExamples=VoiceDashboard hideEditor=true
class App extends Component {
  render() {
    return (
      <Segment piled style={{ margin: '36px' }}>
        <VoiceDashboard />
      </Segment>
    )
  }
}

<App />
```

The `VoiceCommander` will take a stream of commands, and determine what it currently should be working on.  

It will work on it, and give you feedback as it does.

Below, we'll simulate what happens.  

When you click on the 'Next Command' button, we'll simulate what happens when we receive a command from the speech recognition system.

One of the jobs of the `VoiceCommander` is to take the commands it has received so far, and reduce them to an object which can reflect the command's system current focus.

```javascript renderable=true position=above
const commands = [
  "Show me my projects",
  "Lets just see the webapps",
  "Which ones have changed in the past two weeks?",
  "Let's look at the screenshots",
  "Ok lets deploy them to a preview URL"
]

function CommandTracker({ toggleExpand, commandId, data = {} }) {
  const [commandState, updateCommand] = useState(
    $runtime.voiceCommander.commands.get(commandId)
  )

  useEffect(() => {
    $runtime.voiceCommander.commands.observe(({ newValue, name }) => name === commandId && updateCommand(newValue))
  })

  const processTask = async (currentCommand, commandState = {}, commands, index) => {
    const update = {}

    $runtime.voiceCommander.updateCommand(commandId, {
      processing: true,
      completed: false
    })

    const previous = commands[index - 1]
    const currentState = $runtime.voiceCommander.state.get('current') || (previous && previous.update) || {}

    console.log({ currentState, update })
    if (index === 0) {
      update.firstCommand = true
    } else {
      Object.assign(update, currentState, { firstCommand: false })
    }

    if (currentCommand) {
      const { structured = [], nouns = [] } = currentCommand 

      console.log('parsing current command', currentCommand)
      if (update.firstCommand && structured[0] === 'show') {
        update.queryType = 'show'
        update.queryTargets = nouns.map((n) => ({
          noun: n.normal,
          plural: n.normal === n.plural
        })) 
      }

      if (!update.firstCommand) {
        console.log('not first command', structured, update)
        if(update.queryType === 'show' && (structured[0] === 'see just' || structured[0] === 'just see')) {
          update.firstCommand = false
          update.queryModifiers = nouns.map((n) => ({
            type: 'only',
            noun: n.normal,
            plural: n.normal === n.plural
          }))           
        } else if (update.queryType === 'show' && currentCommand.isQuestion) {
          const [questionType, ...subjects] = structured 

          if (questionType === 'which') {
            update.queryModifiers = update.queryModifiers || []
            update.queryModifiers.push({
              type: 'filter',
              args: subjects.map(val => String(val).trim()),
              values: currentCommand.values,
              dates: currentCommand.dates
            })
          }
        } else if (update.queryType === 'show' && !currentCommand.isQuestion) {
          update.queryActions = update.queryActions || []
          update.queryActions.push({
            type: 'subcommand',
            args: currentCommand.structured
          })
        }
      }
    }

    return {
      ...currentCommand,
      update
    } 
  }

  const handleProcess = () =>
    $runtime.voiceCommander
      .process(processTask)
        .then((updates) => {
          const { update = {} } = updates
          updateCommand(updates)
        })
 
  return (
    <Segment raised clearing>
      <Header>
        <Header.Content>
          {commandState.completed && <Icon name="check" />}
          {commandState.processing && <Icon name="spinner" loading />}
          {commandState.command}
        </Header.Content>
        {!commandState.completed && <Button content="Process" floated="right" onClick={handleProcess} />}
      </Header>
    </Segment>
  )
}

function CommandList({ listening }) {
  const [commands, updateCommands] = useState({})
  const [expanded, updateExpanded] = useState({})

  useEffect(() => 
    $runtime.voiceCommander.commands.observe(({ object }) => {
      updateCommands(object.toJSON())
    })
  )

  const items = Object.entries(commands)

  return (
    <Segment>
      <Header color={listening ? 'red' : 'black'} dividing as="h3" content="Responder System" onClick={() => listening && $runtime.speech.stop()}/>
      {!!items.length && <Segment secondary>
      {!!items.length && items.map((item) => {
        const [commandId, data] = item
        const toggleExpand = () => updateExpanded({ ...expanded, [transcriptId]: !expanded[transcriptId]})

        return (
          <CommandTracker 
            toggleExpand={toggleExpand} 
            commandId={commandId} 
            data={data} 
            key={commandId}
          />
        )
      })}
      </Segment>}
    </Segment>
  )
}

class VoiceCommander extends Component {
  state = {
    ready: false
  }

  async componentDidMount() {
    if (!$runtime.isFeatureEnabled('voice-commander')) {
      await $runtime.feature('voice-commander').enable()
    }

    const { voiceCommander } = $runtime

    this.setState(voiceCommander.currentState)

    const disposer = voiceCommander.commands.observe(({ object }) => {
      this.setState(voiceCommander.currentState)
    })   

    const disposer2 = voiceCommander.state.observe(({ object }) => {
      this.setState(voiceCommander.currentState)
    })

    this.disposer = () => {
      disposer()
      disposer2()
    }
  }

  componentWillUnmount() {
    this.disposer()
  }

  render() {
    const { listening } = this.state

    return (
      <Segment>
        {!!commands.length && this.props.handleNextCommand && <Button content="Next Command" onClick={() => this.props.handleNextCommand.call(this)} />}
        <Divider />
        <Grid columns="two">
          <Grid.Column>
            <CommandList listening={listening} />
          </Grid.Column>
          <Grid.Column>
            <Header dividing content="Command State" />
            {this.state.current && <div style={{ maxHeight: '400px', overflowY: 'scroll' }}><pre>{JSON.stringify(this.state.current, null, 2)}</pre></div>}
            {!this.state.current && <Message info>As we receive commands, the commander will update its current focus. We will display that here</Message>}
          </Grid.Column>
        </Grid>
      </Segment>
    )
  }
}

<VoiceCommander 
  handleNextCommand={function() { 
  this.setState({ listening: true });

  if (commands.length) {
    $runtime.voiceCommander.receiveCommand(commands.shift())
  }
 }}/>
```

With the above component, we've simulated how receiving voice commands in sequence can be be used to gradually build a query object.

The next step would be taking this query object, and applying it to some data source we want to inspect.

We can imagine given the sequence of commands in the example above, that we want to look at a portfolio of web applications, see the ones which have changed recently, and then eventually deploy them to a preview URL.

It just so happens there are features for that in Skypager, so we will use them to build a real example of something you can talk to to browse, analyze, and work with a portfolio of JavaScript projects using nothing but your smooth mellow accent.

Look at the table below, this is part of a data set we can filter and act on using the `VoiceCommander` feature.

```javascript renderable=true hideEditor=true
const { axios } = $runtime

function fetchPackageGraph() {
  return axios({
    url: '/packages.json',
    method: 'GET'
  }).then((r) => {
    $doc.state.set('packageData', r.data)
    return r.data.slice(0, 8)
  })
}

function headerRow() {
  return (
    <Table.Row>
      <Table.HeaderCell>Name</Table.HeaderCell>
      <Table.HeaderCell>Project Type</Table.HeaderCell>
      <Table.HeaderCell>Category</Table.HeaderCell>
      <Table.HeaderCell>Modified</Table.HeaderCell>
    </Table.Row>
  )
}

function tableRow(tableData) {
  const get = $runtime.lodash.get
  
  return {
    key: tableData._file.relative,
    children: [
      <Table.Cell>{tableData.name}</Table.Cell>,
      <Table.Cell>{get(tableData, 'skypager.projectType', 'Unknown')}</Table.Cell>,
      <Table.Cell>{get(tableData, 'skypager.category', 'Uncategorized')}</Table.Cell>,
      <Table.Cell>{get(tableData, '_file.stats.mtime', '??').split('T')[0]}</Table.Cell>,
    ]
  }
}

function PackageTable() {
  const [projects, updateProjects] = useState([])  

  useEffect(() => {
    fetchPackageGraph().then((resp) => updateProjects(resp))  
  }, [])

  return (
    <Table 
      tableData={projects} 
      renderBodyRow={tableRow} 
      headerRow={headerRow} 
    />
  )
}

class PackageBrowser extends Component {
  render() {
    return <PackageTable />
  }
}

<PackageBrowser />
```

So let's implement it.

Here's an overview:

- 1) The `VoiceCommander` feature accepts statements from the microphone and puts them in a queue
- 2) The React Component triggers processing of the current voice command on the queue by passing a reducer like function which processes the current command based on the history so far
- 3) The processing of a command will update the `VoiceCommander` state with a property `current` that contains all of the built up parameters
- 4) If there are no more statements left to process, we use the `VoiceCommander` current state data to render a display 

## Defining some Hooks

We're going to define a few custom hooks.

Our `VoiceCommander` feature has two observable objects: `commands` and `state`.  The idea is that every time we
receive a command from the microphone, we parse it to turn it into an object structure, and store it on the commands object.

Our `useVoiceControl` hook will enable the voice commander feature, load the nlp library, enable speech recognition, 
and return the `voiceCommander.state` whenever it changes 

```javascript editable=true example=VoiceDashboard 
function useVoiceControl() {
  const [enabled, setEnabled] = useState($runtime.isFeatureEnabled('voice-commander'))
  const [state, updateVoiceState] = useState($runtime.feature('voice-commander').currentState)

  useEffect(() => {
    $runtime.feature('voice-commander').enable().then(() => setEnabled(true))
  }, [])

  useEffect(() => $runtime.feature('voice-commander').state.observe(({ object }) => {
    updateVoiceState(object.toJSON())
  }))

  return {
    enabled,
    start: (...args) => {
      const disposer = runtime.voiceCommander.start(...args)
      updateVoiceState({
        ...runtime.voiceCommander.currentState,
        listening: true 
      })
      return disposer
    },
    stop: (...args) => {
      runtime.voiceCommander.stop()
      updateVoiceState({
        ...runtime.voiceCommander.currentState,
        listening: false 
      })
    },
    ...state,
  } 
}
```

Our `useCommandState` hook observes the commands queue, and listens for a `commandReceived` event,
which it reacts to by processing the last command we received.

How each command is processed depends on the current command, and any contextual information that
has been built up from previous commands.


```javascript editable=true example=VoiceDashboard
function useCommandState(handler) {
  const [commandState, updateCommandState] = useState({})

  useEffect(() => $runtime.feature('voice-commander').commands.observe(({object}) => {
    updateCommandState(runtime.voiceCommander.commandState)
  }))

  useEffect(() => {
    const handleReceive = () => {
      runtime.voiceCommander.process(handler).then(() => updateCommandState(runtime.voiceCommander.commandState))
    }

    $runtime.voiceCommander.on('receivedCommand', handleReceive)

    return () => $runtime.voiceCommander.off('receivedCommand', handleReceive)  
  })

  return commandState
}
```

To make the `useCommandState` hook work, we need to provide it a handler function to use to process the current command.

This handler function will be called with:

- the current command (first one that hasn't been completed)
- the current commandState  
- the list of all the commands
- the index of the current command in the list

**The actual handler function which processes the current command is a huge mess! and it is too tightly bound to the example script. A Real world implementation would have to lean on natural language processing techniques that I am not even aware of yet.** 

The signature for the command processing function looks like.

```javascript example=VoiceCommander
function yourCommandProcessor(currentCommand, commandState, allCommands, currentIndex, currentCommandId) {
  // you would come up with this exact object based on the currentCommand, commandState, etc
  const update = { whatever: true }

  return {
    ...currentCommand,
    update
  }  
}
```

The assumption is that a sequence of commands will come in a few categories:

**starting with a data set, limiting that data set, taking action on the matches**

- command: prepare the full dataset called "whatever" to be searched
- command: limit the full dataset by this parameter 
- command: customize the resulting data set by some available transformation
- command: customize the resulting data set by some another transformation
- command: perform some action on the dataset

**finding a single item, taking an action on it**

- command: show me these items
- command: show me less
- command: ok found it, get details for this item 
- command: do this in the context of this item
- command: now do this

**requesting a specific view of a dataset**

so by analyzing the current command, past commands, and having a current state that gets updated after anything changes, 
we can identify which category our current conversation belongs to.

Once we know that, and we know the dataset, we can use the `nouns`, `verbs`, `values` and other properties that get stored with each command,
to build some standard query object that can be rendered from the dataset and filters.

The handler implementation is below. 

Feel free to edit it! 

```javascript editable=true example=VoiceDashboard
const processTask = async (currentCommand, commandState = {}, commands, index, commandId) => {
  const update = {}

  $runtime.voiceCommander.updateCommand(commandId, {
    processing: true,
    completed: false
  })

  const previous = commands[index - 1]
  const currentState = $runtime.voiceCommander.state.get('current') || (previous && previous.update) || {}

  if (index === 0) {
    update.firstCommand = true
  } else {
    Object.assign(update, currentState, { firstCommand: false })
  }

  if (currentCommand) {
    const { structured = [], nouns = [] } = currentCommand 

    if (update.firstCommand && structured[0] === 'show') {
      update.queryType = 'show'
      update.queryTargets = nouns.map((n) => ({
        noun: n.normal,
        plural: n.normal === n.plural
      })) 
    }

    if (!update.firstCommand) {
      if(update.queryType === 'show' && (structured[0] === 'see just' || structured[0] === 'just see')) {
        update.firstCommand = false
        update.queryModifiers = nouns.map((n) => ({
          type: 'only',
          noun: n.normal,
          plural: n.normal === n.plural
        }))           
      } else if (update.queryType === 'show' && currentCommand.isQuestion) {
        const [questionType, ...subjects] = structured 

        if (questionType === 'which') {
          update.queryModifiers = update.queryModifiers || []
          update.queryModifiers.push({
            type: 'filter',
            args: subjects,
            values: currentCommand.values,
            dates: currentCommand.dates
          })
        }
      } else if (update.queryType === 'show' && !currentCommand.isQuestion) {
        update.queryActions = update.queryActions || []
        update.queryActions.push({
          type: 'subcommand',
          args: currentCommand.structured
        })
      }
    }
  }

  return {
    ...currentCommand,
    update
  } 
}
```

After any command is processed, the `VoiceCommander` feature state will have a `current` object,
this object tells us:

```javascript
  const { 
    // what type of query is it? show
    queryType: type, 
    // what are we querying? projects
    queryTargets: targets = [],
    // how are we modifying the query? 
    queryModifiers: modifiers = []
    // what actions are we taking on the results it returns
    queryActions: actions = [], 
  } = query  
```

Any time we get a new `query`, we analyze its components, and try and apply it to filter the data.

Any time the data changes, React renders new output.

## Getting Started

The state management aspect of our application is all completely handled by the skypager runtime and features we built.

The observable apis and event emitters skypager provide us work very well with React hooks.

Everytime the `useCommandState` hook returns a value, that will get rendered by the `QueryOutput` component below

```javascript editable=true example=VoiceDashboard
function QueryOutput({ query }) {
  const [projects, updateProjects] = useState(
    $doc.state.get('packageData') || []
  )

  useEffect(() => $doc.state.observe(({ name, newValue }) => name === 'packageData' && updateProjects(newValue)))

  const { 
    queryType: type, 
    queryTargets: targets = [],
    queryActions: actions = [], 
    queryModifiers: modifiers = [],
    firstCommand = true
  } = query  

  let currentView = 'results'

  let results = []

  const data = {
    projects
  }


  if (type === 'show' && targets.length) {
    targets.forEach(({ noun }) => {
      if (data[noun]) {
        results.push(...data[noun])
      }
    })
  }

  if (type === 'show' && modifiers.length) {
    modifiers.forEach(({ type, noun, args = [] }) => {
      if (type === 'only' && noun === 'web apps') {
        results = results.filter(project => project && project.skypager && project.skypager.projectType === 'webapp')
      } else if (type === 'filter' && args[0] === 'change' && args[1] === 'weeks') {
        results = results.slice(0, 4)
      }
    })
  }

  if (type === 'show' && actions.length) {
    actions.forEach(({ type, args = [] }) => {
      if (type === 'subcommand') {
        currentView = args.join('_')
      }
    })
  }

  return (
    <Segment basic>
      {results.slice(0, 6).map((result, i) => {
        switch(currentView) {
          case 'look_screenshots':
            return (
              <ScreenshotBrowser project={result} />
            )
          case 'deploy_preview url': 
            return (
              <DeploymentAction project={result} />
            )
          case 'results':
          default:  
            return (
              <Segment key={`result-${i}`}>
                <Header as="h4" content={result.name} subheader={result.description} />
              </Segment>              
            )
        }

      })}
    </Segment>
  )
}

function DeploymentAction({ project }) {
  const [percent, update] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      update(percent = percent + 2)
      if (percent > 100) {
        clearInterval(interval)
      }
    }, 30)

    setTimeout(() => {
      update(100)
    }, 600)

    return () => {} 
  })

  return (
     <Segment key={`result-${project.name}`}>
      <Header as="h4" content={`Deploying ${project.name}`} subheader={project.homepage} />   
      {percent < 100 && <Progress indicating percent={percent} />}
      {percent >= 100 && <Button success content="Deployed! Open Preview" as="a" target="_blank" />}
    </Segment>
  )
}

function ScreenshotBrowser({ project }) {
  return (
    <Segment key={`result-${project.name}`}>
      <Header as="h4" content={`Screenshots of ${project.name}`} subheader={project.homepage} />
      <Table>
        <Table.Body>
          <Table.Row>
            <Table.Cell>Home Page</Table.Cell>
            <Table.Cell><Icon name="image" circular /></Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.Cell>Login Page</Table.Cell>
            <Table.Cell><Icon name="image" circular /></Table.Cell>
          </Table.Row>                   
        </Table.Body>
      </Table>
    </Segment>    
  )  
}
```

Below we define the `VoiceDashboard` component which ties these all together.

```javascript editable=true example=VoiceDashboard 
function VoiceDashboard() {
  const { enabled, listening, stop, start, ...rest } = useVoiceControl()
  const commandState = useCommandState(processTask)

  if (!enabled) {
    return (
      <Loader active />
    )
  }

  const commands = [
    "Show me my projects",
    "Lets just see the webapps",
    "Which ones have changed in the past two weeks?",
    "Let's look at the screenshots",
    "Ok lets deploy them to a preview URL"
  ]
  
  return (
    <Grid>
      <Grid.Row divided="vertical">
        <Grid.Column width={4}>
          <Header dividing content="Stick to the script!" />
          {commands.map((command) => <Segment key={command}>{command}</Segment>)}
        </Grid.Column>
        <Grid.Column width={4}>
          <Header dividing content="Received Commands" />
          {$runtime.voiceCommander.commands.values().map(({ command, commandId }) => <Segment key={commandId}>{command}</Segment>)}
        </Grid.Column>       
        <Grid.Column width={8}>
          {listening && !rest.current && <Message content="Say something to begin!" />}
          {rest.current && <QueryOutput query={rest.current} />}
        </Grid.Column>
      </Grid.Row>
      <Grid.Row columns="one">
        <Grid.Column style={{ paddingLeft: '25px', paddingRight: '25px' }}>
          <Button 
            icon='microphone'
            content={listening ? 'STOP' : 'Enable Speech Recognition'} 
            color={listening ? 'red' : 'green'} 
            onClick={() => listening ? stop() : start()} 
            fluid
          />
        </Grid.Column>
      </Grid.Row>      
    </Grid>
  )
}
```

## Demo

```javascript renderable=true includeExamples=VoiceDashboard hideEditor=true
class App extends Component {
  render() {
    return (
      <VoiceDashboard />
    )
  }
}

<App />
```
