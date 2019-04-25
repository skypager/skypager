module.exports = async function setupPortfolioManagerSocketServer(socket, runtime) {
  runtime.use(require('@skypager/portfolio-manager'))

  await runtime.feature('portfolio-manager').enable()
  console.log('Starting Portfolio Manager')
  await runtime.fileManager.startAsync({ startPackageManager: true })
  await runtime.portfolio.startAsync()

  socket.subscribe('/project-hashes/:projectName', projectId => {
    const projectName = projectId.startsWith(runtime.portfolio.scope)
      ? projectId
      : `${runtime.portfolio.scope}/${projectId}`

    getProjectHash(projectName)
      .then(result => socket.publish(`/project-hashes/${projectId}`, { result, projectName }))
      .catch(error => {
        socket.publish(`/project-hashes/${projectId}`, { projectName, error })
      })
  })

  socket.subscribe('/build-hashes/:projectName', (projectId, ...args) => {
    const projectName = projectId.startsWith(runtime.portfolio.scope)
      ? projectId
      : `${runtime.portfolio.scope}/${projectId}`

    getProjectBuildHash(projectName)
      .then(result => socket.publish(`/build-hashes/${projectId}`, { result, projectName }))
      .catch(error => {
        socket.publish(`/build-hashes/${projectId}`, { projectName, error })
      })
  })

  console.log('Finished.')
  async function getProjectHash(projectName) {
    const response = await runtime.portfolio.hashProjectTrees({ projects: [projectName] })
    return response && response[projectName] ? response[projectName] : response
  }

  async function getProjectBuildHash(projectName) {
    const response = await runtime.portfolio.hashBuildTree(projectName)
    return response
  }
}
