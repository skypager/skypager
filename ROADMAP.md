# ROADMAP

## 0.3 Release
- Write / Create / Update in sheets helper
- Write / Create / Update in package / file manager

## 1.0 Release
- Upgrade to Webpack 4
- Upgrade Mobx to latest
- Figure out how to add better autocomplete support for IDE users
- Reduce lodash usage
  - Refactor lodash usage to remove any usage of chain
  - Remove full lodash module dependency
  - Only mixin select methods

## 1.1 Release
  - Dedicated native runtime for React Native (port from previous skypager project)
  - Dedicated electron runtime for Electron (port from previous skypager project)
  - port localStorage feature to provide wrapper around all platform localStorage implementations
    - json storage for electron
    - node-localstorage for node
    - async storage for react native

## 1.2 Release
  - Desktop App