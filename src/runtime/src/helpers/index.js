import Helper, {
  ContextRegistry,
  registerHelper,
  createHost,
  createMockContext,
  attach,
  attachAll,
  registry,
  createContextRegistry,
} from "./helper"

const createRegistry = createContextRegistry

export {
  attach,
  attachAll,
  registry,
  createRegistry,
  createContextRegistry,
  createHost,
  createMockContext,
  ContextRegistry,
  registerHelper,
}

export default Helper

registerHelper("feature", () => require("./feature"))
