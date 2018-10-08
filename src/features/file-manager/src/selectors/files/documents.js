export default (async function selectDocuments(chain, options = {}) {
  const { mapKeys = (v, k) => k, mapValues = v => v } = options
  const results = await this.select('files/asts', { ...options, debug: true })
  const { fileIds } = results

  return (
    chain
      .plant(fileIds)
      // .map(fileId => this.convertToJS(this.fileManager.file(fileId)))
      .keyBy(file => file.relative)
      .mapKeys(mapKeys)
      .mapValues(mapValues)
      .mapValues((attributes, docId) => {
        if (options.lazy) {
          return (extensions = {}) => {
            this.documents.register(docId, {
              ...attributes,
              id: docId,
              ...extensions,
            })

            return this.document(docId)
          }
        } else {
          this.documents.register(docId, {
            ...attributes,
            id: docId,
            ...extensions,
          })

          return this.document(docId)
        }
      })
  )
})
