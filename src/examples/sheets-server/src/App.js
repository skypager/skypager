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
} from 'semantic-ui-react'

class ListSheets extends Component {
  render() {
    const { onClick, sheets = {} } = this.props
    const records = Object.keys(sheets).map(id => Object.assign({}, sheets[id], { id }))

    return (
      <Container>
        <Header dividing as="h1" content="Available Sheets" />
        <Message icon>
          <Icon name="google drive" />
          <Message.Content>
            The following sheets are available in our REST API. These sheets are going to be the
            ones shared with the email address in your service account.
          </Message.Content>
        </Message>
        <Card.Group>
          {records.map((record, idx) => (
            <Card key={record.id + idx} onClick={() => onClick(record.id, record)}>
              <Card.Content>
                <Header as="h4" content={record.id} />
              </Card.Content>
            </Card>
          ))}
        </Card.Group>
      </Container>
    )
  }
}

class ShowSheet extends Component {
  render() {
    return (
      <Container>
        <Header as="h3" content="Table View" />
        <TableView {...this.props} />
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
    return client.showFullSheet(sheetId).then(data => this.setState({ loading: false, data }))
  }

  render() {
    const { loading, sheets, sheetId, data } = this.state

    return (
      <Container style={{ marginTop: '40px' }}>
        {loading && <Loader active />}
        {!loading &&
          !sheetId &&
          sheets && <ListSheets onClick={this.selectSheet.bind(this)} sheets={sheets} />}
        {!loading &&
          sheetId &&
          data && (
            <ShowSheet
              goBack={() => this.setState({ sheetId: undefined })}
              data={data}
              sheetId={sheetId}
            />
          )}
      </Container>
    )
  }
}

export default App
