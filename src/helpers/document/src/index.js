import Babel from './babel/babel'
import MdxBase from './mdx/mdx'
import VmRunner from './features/vm-runner'
import editor from './features/editor'
import bundle from './features/bundle'

class Mdx extends MdxBase {
  get file() {
    return this.tryGet('file', {
      path: `${this.name}.md`,
    })
  }

  get content() {
    return this.tryGet('content', this.tryGet('file.content'))
  }

  async run(options = {}) {
    await this.process(options)
    await this.toRunnable()

    const blocks =
      typeof options.filter === 'function' ? this.runners.filter(options.filter) : this.runners

    for (let block of blocks) {
      await block.runner.run()
    }
  }

  async toExport(options = {}) {
    const script = await this.toScriptHelper(options)

    const runner = await script.createVMRunner(options)

    const { vmContext } = runner

    options = {
      ...options,
    }

    await this.toRunnable({ ...options, vmContext })
    return this.toFunctions({ ...options, merge: true })
  }

  get childScripts() {
    return this.chain
      .get('runners')
      .map(r => r.script)
      .keyBy(s => s.name)
      .value()
  }

  get childRunners() {
    return this.chain
      .get('runners')
      .keyBy(r => r.script.name)
      .mapValues(r => r.runner)
      .value()
  }

  get resultsByExportName() {
    const { stringUtils } = this.runtime
    const { camelCase, kebabCase } = stringUtils
    const { pick } = this.lodash

    const nameFn = ({ parentHeading, i }) => camelCase(kebabCase(parentHeading))

    return this.chain
      .get('runners')
      .groupBy(runner => nameFn(runner))
      .mapValues(runners =>
        runners
          .map(({ runner }) => runner.currentState.ran && pick(runner, 'results', 'errors'))
          .filter(Boolean)
      )
      .value()
  }

  toFunctions(options = {}) {
    const { stringUtils } = this.runtime
    const { camelCase, kebabCase } = stringUtils

    const nameFn =
      options.nameFn ||
      (({ parentHeading, i }) =>
        camelCase(kebabCase(parentHeading)) + (!options.merge && i ? i : ''))

    if (!options.merge) {
      const individualFunctions = this.chain.get('runners').keyBy(runner => nameFn(runner))

      return individualFunctions.mapValues(({ runner }) => (...args) => runner.run(...args)).value()
    }

    return this.chain
      .get('runners')
      .groupBy(runner => nameFn(runner))
      .mapValues((runners, fnName) => {
        // this function runs all the blocks
        async function runAllBlocksInSequence(...args) {
          for (let r of runners) {
            await r.runner.run(...args)
          }
        }

        runners.length > 1 &&
          runners.forEach(r => {
            runAllBlocksInSequence[`_block${r.i}`] = (...args) => r.runner.run(...args)
          })

        return { [fnName]: runAllBlocksInSequence }
      })
      .values()
      .reduce((memo, fn) => ({ ...memo, ...fn }), {})
      .value()
  }

  async toRunnable(options = {}) {
    const runners = await this.createVMRunners(options)
    this.state.set('runners', runners)
    return this
  }

  get runners() {
    if (this.currentState.runners) {
      return this.currentState.runners
    } else {
      this.state.set('runners', [])
    }

    return this.state.get('runners')
  }

  async toScriptHelper(options = {}) {
    const { id = this.runtime.relative(this.file.path) } = options

    let { content = this.currentState.parsedContent, metadata = {} } = options

    if (!content || !content.length) {
      const { meta, code } = await this.parse(options)
      content = code

      metadata = Object.assign({}, meta, metadata)
    }

    return this.runtime.script(id, {
      ...options,
      meta: metadata,
      file: this.file,
      content,
    })
  }

  /**
   *
   */
  async process(options) {
    const scriptHelper = await this.toScriptHelper(options)
    const { ast, headingsMap, default: defaultExport, meta } = await scriptHelper
      .parse()
      .then(() => scriptHelper.sliceModule('ast', 'headingsMap', 'default', 'meta'))

    this.state.set('default', defaultExport)
    this.state.set('meta', {
      ...meta,
      ...scriptHelper.tryGet('meta', {}),
    })
    this.state.set('headingsMap', headingsMap)
    this.state.set('ast', ast)

    return {
      ast,
      meta: this.currentState.meta,
      headingsMap,
      default: defaultExport,
    }
  }

  /**
   * Takes the raw markdown mdx content, parses it with mdx, and then transpiles the resulting
   * code.
   */
  async transpile(options = {}) {
    const { code, meta, ast } = await require('@skypager/helpers-mdx')(this.content, {
      filePath: this.file.path,
      babel: true,
      ...options,
    })

    this.state.set('transpiledContent', code)

    return { code, ast, meta }
  }

  /**
   * Takes the raw markdown mdx content, and parses it with mdx, returning jsx code
   */
  async parse(options = {}) {
    if (!this.file.path) {
      console.log('WTF OVER')
      process.exit(1)
    }

    const { code, ast, meta } = await require('@skypager/helpers-mdx')(this.content, {
      filePath: this.file.path,
      ...options,
      rehypePlugins: [
        () => tree => {
          this.state.set('rehypeAst', tree)
          return tree
        },
      ],
      babel: false,
    })

    this.state.set('parsed', true)
    this.state.set('parsedContent', code)

    return { ast, code, meta }
  }

  get headingLineNumbers() {
    return this.chain
      .get('headingsMap.lines')
      .invert()
      .mapValues(v => parseInt(v, 10))
      .entries()
      .sortBy(v => v[1])
      .fromPairs()
      .value()
  }

  async createVMRunners(options = {}) {
    const { codeBlocks } = this

    const script = await this.toScriptHelper(options)
    const prefix = script.name
    const { vmContext } = await script.createVMRunner(options)

    return Promise.all(
      codeBlocks
        .filter(b => b.lang && b.lang === 'javascript')
        .map((node, i) => {
          const { value, position } = node

          const parent = this.findParentHeading(node)
          const parentHeading = this.findParentHeading(node, { stringify: true })
          const script = this.runtime.script(`${prefix}/${i}`, {
            content: value,
            meta: { position, parent },
          })

          const startLine = script.tryGet('meta.position.start.line', 0)

          return script
            .parse()
            .then(() =>
              script.createVMRunner({
                ...options,
                vmContext,
              })
            )
            .then(runner => ({
              i,
              index: i,
              script,
              position,
              startLine,
              runner,
              run: (...args) => runner.run(...args),
              parentHeading,
              depth: parent.depth,
            }))
        })
    )
  }

  static attach(runtime, options) {
    MdxBase.attach(runtime, {
      baseClass: Mdx,
      ...options,
    })
  }
}

export function attach(runtime, opts) {
  runtime.features.add({
    'vm-runner': VmRunner,
    editor,
    bundle,
  })

  runtime.Babel = Babel
  runtime.Mdx = Mdx

  Babel.attach(runtime)
  Mdx.attach(runtime)

  runtime.mdxDocs.babelConfig = (options = {}) =>
    require('@skypager/helpers-mdx/babel-config')({
      modules: true,
      ...(opts.babelConfig || {}),
      ...options,
    })
}
