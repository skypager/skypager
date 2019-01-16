import runtime from '@skypager/web'
import React, { Component } from 'react'
import {
  Button,
  Header,
  Icon,
  Loader,
  Container,
  Card,
  Message,
  Segment,
  Table,
  Grid,
} from 'semantic-ui-react'
import Readme from '../README.md'

class ListSheets extends Component {
  render() {
    const { onClick, sheets = {} } = this.props
    const records = Object.keys(sheets).map(id => Object.assign({}, sheets[id], { id }))

    return (
      <Container fluid>
        <Grid>
          <Grid.Column width={6}>
            <Message icon color="green">
              <Icon name="google drive" />
              <Message.Content>
                Below you will find any available google sheet which is shared with the email found
                in your google cloud service account credentials. (Make sure the google drive and
                google sheets apis are enabled)
              </Message.Content>
            </Message>
            <Header dividing as="h1" content="Available Sheets" />
            <Segment secondary>
              <Card.Group>
                {records.map((record, idx) => (
                  <Card key={record.id + idx} onClick={() => onClick(record.id, record)}>
                    <Card.Content>
                      <Header as="h4" content={record.id} />
                    </Card.Content>
                  </Card>
                ))}
              </Card.Group>
            </Segment>
          </Grid.Column>
          <Grid.Column width={10}>
            <Segment piled>
              <Readme />
            </Segment>
          </Grid.Column>
        </Grid>
      </Container>
    )
  }
}

class ShowSheet extends Component {
  render() {
    const createLink = id => `https://docs.google.com/spreadsheets/d/${id}`
    let { id } = this.props.info
    const { sheetId } = this.props

    id = id.replace(/.*worksheets\//, '').replace(/\/private.*$/, '')

    return (
      <Container>
        <Segment basic>
          <Header as="h3" content="REST API" dividing />
          View the entire sheet
          <Segment secondary>
            <pre>GET /sheets/{sheetId}</pre>
          </Segment>
          View an individual worksheet
          <Segment secondary>
            <pre>GET /sheets/{sheetId}/:workSheetId</pre>
          </Segment>
          View sheet metadata
          <Segment secondary>
            <pre>GET /sheets-meta/{sheetId}</pre>
          </Segment>
        </Segment>
        <Header as="h3" content="Table View" />
        <TableView {...this.props} />
        <Header as="h3" content="Data View" />
        <Segment secondary>
          <pre>{JSON.stringify(this.props.data || {}, null, 2)}</pre>
        </Segment>
        <Button content="Go Back" onClick={this.props.goBack} />

        <Header as="h3" content="Sheet Info" />
        <a target="_blank" href={createLink(id)}>
          View On Web
        </a>
        <Segment secondary>
          <pre>{JSON.stringify(this.props.info || {}, null, 2)}</pre>
        </Segment>
        <Button content="Go Back" onClick={this.props.goBack} />
      </Container>
    )
  }
}

class TableView extends Component {
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

export class App extends Component {
  state = {
    loading: true,
  }

  async componentDidMount() {
    const { runtime } = this.props
    const client = runtime.client('app')
    const sheets = await client.listSheets()
    this.setState({ sheets, loading: false })
  }

  selectSheet(sheetId) {
    const { runtime } = this.props
    const client = runtime.client('app')

    this.setState({ sheetId, loading: true })

    client
      .showFullSheet(sheetId)
      .then(data => this.setState({ data }))
      .then(() => client.showSheetMetadata(sheetId))
      .then(({ info }) => {
        this.setState({ info, loading: false })
      })
  }

  render() {
    const { loading, sheets, sheetId, data, info } = this.state

    return (
      <Container fluid style={{ marginTop: '40px', padding: '48px' }}>
        {loading && <Loader active />}
        {!loading && !sheetId && sheets && (
          <ListSheets onClick={this.selectSheet.bind(this)} sheets={sheets} />
        )}
        {!loading && sheetId && data && info && (
          <ShowSheet
            goBack={() => this.setState({ sheetId: undefined })}
            data={data}
            info={info}
            sheetId={sheetId}
          />
        )}
      </Container>
    )
  }
}

export default App
