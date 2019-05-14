export async function discover(options = {}) {
  if (!this.runtime.isNode) {
    return
  }

  if (this.runtime.fileManager && this.runtime.fileManager.status !== 'READY') {
    await this.runtime.fileManager.startAsync()
    await this.runtime.fileManager.readAllContent(/\.md$/i)
  }

  this.add(
    this.runtime.requireContext(/\.md$/i, {
      keyBy: 'relative',
      requireFn: path => {
        const file = this.runtime.file(path)

        return {
          ...file,
          ...(options.defaults || {}),
        }
      },
    })
  )
}
