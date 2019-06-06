import React, { createRef, Fragment, Component } from 'react'
import { Header } from 'semantic-ui-react'
import types from 'prop-types'

export default class ScrollableHeader extends Component {
  static contextTypes = {
    runtime: types.object,
  }

  linkRef = createRef()

  state = {
    scrolled: false,
    locationHash: undefined,
  }

  componentDidMount() {
    const { runtime } = this.context
    const { kebabCase } = runtime.stringUtils
    const slug = kebabCase(
      String(this.props.content)
        .trim()
        .toLowerCase()
    )

    const { locationHash } = runtime.currentState

    this.setState({
      locationHash,
      slug,
    })

    this.disposer = runtime.state.observe(({ name, newValue }) => {
      if (name === 'locationHash') {
        this.setState({ locationHash: newValue, scrolled: false })
      }
    })
  }

  componentDidUpdate() {
    const { slug, scrolled, locationHash } = this.state

    const linkRef = this.linkRef

    if (!scrolled && locationHash && locationHash.length) {
      if (slug === String(locationHash).replace('#', '')) {
        linkRef.current.scrollIntoView(true)
        this.setState({ scrolled: true })
      }
    }
  }

  componentWillUnmount() {
    this.disposer && this.disposer()
  }

  render() {
    const { runtime } = this.context
    const { kebabCase } = runtime.stringUtils
    const slug = kebabCase(
      String(this.props.content)
        .trim()
        .toLowerCase()
    )

    return (
      <Fragment>
        <a name={slug} ref={this.linkRef} />
        <Header {...this.props} />
      </Fragment>
    )
  }
}
