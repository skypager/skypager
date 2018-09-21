export const interfaceMethods = ['listSheets', 'showFullSheet', 'showWorksheet']

export function listSheets(query = {}) {
  const { baseURL } = this
  console.log(this, baseURL)
  return this.client.get(`/sheets`, { query }).then(r => r.data)
}

export function showFullSheet(sheetKey, query = {}) {
  const { baseURL } = this
  return this.client.get(`/sheets/${sheetKey}`, { query }).then(r => r.data)
}

export function showWorksheet(sheetKey, worksheetKey, query = {}) {
  const { baseURL } = this
  return this.client.get(`/sheets/${sheetKey}/worksheetKey`, { query }).then(r => r.data)
}
