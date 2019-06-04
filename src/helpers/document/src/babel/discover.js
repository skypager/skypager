export async function discover(options = {}) {
  if (this.runtime.fileManager && this.runtime.fileManager.status !== 'READY') {
    await this.runtime.fileManager.startAsync()
  }

  await this.runtime.fileManager.readAllContent({ include: [/\.js$/], ...options })

  this.add(
    this.runtime.requireContext(/\.js$/i, {
      keyBy: 'relative',
      requireFn: path => {
        const file = this.runtime.file(path)

        return {
          file,
          ...(options.defaults || {}),
        }
      },
    })
  )

  const initializer = (id) => {
    const scriptHelper = this.runtime.script(id)
    return typeof options.create === 'function'
      ? options.create(scriptHelper)
      : scriptHelper
  }

  return options.create
    ? this.available.map(initializer)
    : this.available
}
