module.exports = async function setupPortfolioManagerSocketServer(socket, runtime) {
  const { enableVm } = runtime.argv

  runtime.use(require('@skypager/portfolio-manager'))

  await runtime.feature('portfolio-manager').enable()
  console.log('Starting Portfolio Manager')
  await runtime.fileManager.startAsync({ startPackageManager: true })
  await runtime.portfolio.startAsync()

  socket.on('error', e => {
    console.log('error', e.message)
  })

  createInvokeChannel(runtime.fileManager, '/file-manager/invoke')
  createInvokeChannel(runtime.packageManager, '/package-manager/invoke')
  createInvokeChannel(runtime.moduleManager, '/module-manager/invoke')
  createInvokeChannel(runtime.portfolio, '/portfolio/invoke')

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

  if (enableVm) {
    console.log('VM Enabled')
    socket.subscribe(
      '/vm/run-code',
      ({ code, messageId, taskId = messageId || runtime.hashObject({ code }), ...options }) => {
        const replyChannel =
          options.replyChannel || `/vm/run-code/response/${taskId.replace(/\W/g, '')}`

        console.log('VM Got Task', { taskId, code, replyChannel })

        runCode(code, options)
          .then(({ cacheKey, integrity }) => {
            return socket.publish(replyChannel, { cacheKey, integrity, error: false })
          })
          .catch(error => socket.publish(replyChannel, { result: error, error: true }))
      }
    )
  }

  console.log('Finished.')

  async function runCode(code, options = {}) {
    const { refresh = false } = options

    const cacheKey = runtime.hashObject({
      code,
      ...(refresh && { cacheBuster: Math.random() }),
    })

    const inCache = await runtime.fileManager.cache.get(cacheKey).catch(e => false)

    if (inCache) {
      runtime.debug('portfolio socket vm cache hit', {
        cacheKey,
        integrity: inCache.integrity,
        code,
      })

      return {
        cacheKey,
        integrity: inCache.integrity,
      }
    } else {
      runtime.debug('portfolio socket vm cache miss', {
        cacheKey,
        code,
      })

      const response = await runtime.scriptRunner.runCode(code, options)
      const result = runtime.lodash.cloneDeep(response.result)
      const integrity = await runtime.fileManager.cache.put(cacheKey, JSON.stringify(result))
      return { cacheKey, integrity }
    }
  }

  async function getProjectHash(projectName) {
    const response = await runtime.portfolio.hashProjectTrees({ projects: [projectName] })
    return response && response[projectName] ? response[projectName] : response
  }

  async function getProjectBuildHash(projectName) {
    const response = await runtime.portfolio.hashBuildTree(projectName)
    return response
  }

  function createInvokeChannel(host, prefix) {
    socket.subscribe(prefix, ({ refresh = false, method = 'get', args = [], messageId }) => {
      if (!messageId) {
        return
      }

      const responseKey = `${prefix}/response/${messageId}`
      const cacheKey = runtime.hashObject({
        prefix,
        responseKey,
        method,
        args,
        ...(refresh && { cacheBuster: Math.random() }),
      })

      runtime.fileManager.cache
        .get(cacheKey)
        .then(({ metadata = {}, integrity = '' }) => {
          runtime.debug('portfolio socket cache hit', {
            cacheKey,
            integrity,
            method,
            args,
            host: host.name,
            uuid: host.uuid,
          })
          socket.publish(responseKey, {
            metadata,
            integrity,
          })
        })
        .catch(error => {
          if (error.code === 'ENOENT') {
            runtime.debug('portfolio socket cache miss', {
              cacheKey,
              method,
              args,
              host: host.name,
              uuid: host.uuid,
            })

            Promise.resolve(host.invoke(method, ...args))
              .then(result => runtime.fileManager.cache.put(cacheKey, JSON.stringify(result)))
              .then(integrity => socket.publish(responseKey, { integrity: integrity.toString() }))
          }
        })
    })
  }
}
