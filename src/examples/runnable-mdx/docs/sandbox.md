# Sandbox

```javascript
import React, { Component, useState, useEffect, useReducer } from 'react'

export const main = Object.assign({}, window.semanticUIReact, { 
  Component,
  React,
  useState,
  useEffect,
  useReducer
})

export default main
```