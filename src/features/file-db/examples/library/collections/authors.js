import types from 'prop-types'

export const api = {
  createAuthor,
  updateAuthor,
  validate,
}

export const schema = {
  name: types.string.isRequired,
}

function validate(attributes = {}) {
  return types.checkPropTypes(schema, attributes, 'prop', 'authors')
}
async function createAuthor({ name, ...rest } = {}) {
  const resp = await this.insert({ name, type: 'author' })
  return resp
}

async function updateAuthor(id, updates = {}) {
  const resp = await this.patch({ _id: id }, updates)
}
