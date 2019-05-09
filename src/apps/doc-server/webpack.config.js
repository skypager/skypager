const ext = (modName, varName) => ({
  [modName]: {
    root: `${varName}`,
    commonjs: modName,
    commonjs2: modName,
    umd: modName,
  },
})
module.exports = {
  externals: [
    {
      ...ext('react', 'React'),
      ...ext('react-dom', 'ReactDOM'),
      ...ext('react-router-dom', 'ReactRouterDOM'),
      ...ext('semantic-ui-react', 'semanticUIReact'),
    },
  ],
}
