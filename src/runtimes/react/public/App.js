const { skypager, React } = window
console.log('skpae', skypager.hooks)
const { useRuntimeState, useClientRequest } = skypager.hooks

skypager.clients.register('test', () => ({
  interfaceMethods: ['loadManifest', 'useRequest'],
  useRequest(method, ...args) {
    return useClientRequest(this, method, ...args)
  },
  async loadManifest() {
    await new Promise((resolve) => setTimeout(resolve, 3000))
    return this.client.get('/build-manifest.json')
  },
}))

const client = skypager.client('test')

function App() {
  const { stage } = useRuntimeState(skypager, 'stage')
  const { data, loading, error } = client.useRequest('loadManifest') 

  if (loading) {
    return `loading... ${stage}`
  }

  if (error) {
    return error.message
  }

  return <pre>{JSON.stringify(data, null, 2)}</pre>
}

skypager.emit('appLoaded', App)
