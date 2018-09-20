const { React, skypager, semanticUIReact, ReactDOM, ReactRouterDOM } = global
const { Header, Loader, Container, Segment, Table } = semanticUIReact
const { render } = ReactDOM
const { Component } = React

skypager.clients.register('app', () => ({
  methods: ['sheets', 'sheet'],
  async sheets() {
    return this.client.get('/sheets').then(r => r.data)
  },
  async sheet(sheetId, worksheetId) {
    return worksheetId
      ? this.client.get(`/sheets/${sheetId}/${worksheetId}`).then(r => r.data)
      : this.client.get(`/sheets/${sheetId}`).then(r => r.data)
  },
}))

class ListSheets extends Component {
  render() {
    const { onClick, sheets = {} } = this.props
    const records = Object.keys(sheets).map(id => Object.assign({}, sheets[id], { id }))

    return (
      <Container>
        {records.map((record, idx) => (
          <Segment key={record.id + idx} onClick={() => onClick(record.id, record)} raised>
            <Header content={record.id} />
          </Segment>
        ))}
      </Container>
    )
  }
}

class ShowSheet extends Component {
  render() {
    const { entries } = runtime.lodash
    const { data = {}, sheetId } = this.props

    return entries(data).map(([worksheetId, rows]) => (
      <Table key={worksheetId}>
        {rows[0] && (
          <Table.Header>
            {Object.keys(rows[0]).map((val, k) => (
              <Table.HeaderCell key={`th-${k}`}>{val}</Table.HeaderCell>
            ))}
          </Table.Header>
        )}
        <Table.Body>
          {rows.map((row, index) => (
            <Table.Row key={`row-${index}`}>
              {Object.values(row).map((val, k) => (
                <Table.Cell key={`row-${k}`}>{val}</Table.Cell>
              ))}
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
    ))
  }
}

class App extends Component {
  state = {
    loading: true,
  }

  async componentDidMount() {
    const sheets = await skypager.client('app').sheets()
    this.setState({ sheets, loading: false })
  }

  selectSheet(sheetId) {
    this.setState({ sheetId, loading: true })
    return skypager
      .client('app')
      .sheet(sheetId)
      .then(data => this.setState({ loading: false, data }))
  }

  render() {
    const { loading, sheets, sheetId, data } = this.state

    return (
      <Container>
        {loading && <Loader active />}
        {!loading &&
          !sheetId &&
          sheets && <ListSheets onClick={this.selectSheet.bind(this)} sheets={sheets} />}
        {!loading && sheetId && data && <ShowSheet data={data} sheetId={sheetId} />}
      </Container>
    )
  }
}

render(<App />, document.getElementById('root'))
