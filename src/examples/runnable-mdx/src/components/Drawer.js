import React, { Component } from 'react'
import { createPortal } from 'react-dom'

export default class Drawer extends Component {
  constructor(props) {
    super(props)
    const el = this.el = document.createElement('div')

    el.style.height = '100%'
    el.style.width = '100%'
    el.style.margin = '0px'
    el.style.padding = '0px'

    this.rootEl = document.getElementById(`${this.props.drawerId}-sidebar`)
  } 
  
  componentDidMount() {
    this.rootEl.appendChild(this.el)
  }

  componentWillUnmount() {
    this.rootEl.removeChild(this.el)
  }

  render() {
    return createPortal(this.props.children, this.el)  
  }
} 