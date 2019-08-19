export const api = {
  createBook,
  updateBook,
}

async function createBook({ title, author, ...rest }) {
  const resp = await this.insert({ title, author, type: 'book' })
  return resp
}

async function updateBook() {}
