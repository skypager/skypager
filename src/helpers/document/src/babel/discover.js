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
}
