/** @license Licenced under MIT - qbus - ©2015 Pehr Boman <github.com/unkelpehr> */

/**
 * Normalizes given path by converting double frontslashes to singles
 * and removing the slashes from the beginning and end of the string.
 *
 * @param  {String} path The path to normalize
 * @return {String}      Normalized path
 */
function normalizePath(path) {
  // Remove double slashes
  if (path.indexOf('//') !== -1) {
    path = path.replace(/\/+/g, '/')
  }

  // Shift slash
  if (path[0] === '/') {
    path = path.substr(1)
  }

  // Pop slash
  if (path[path.length - 1] === '/') {
    path = path.substr(0, path.length - 1)
  }

  return path
}

/**
 * Helper function for fast execution of functions with dynamic parameters.
 *
 * @method     exec
 * @param      {Function}  func     Function to execute
 * @param      {Object}    context  Object used as `this`-value
 * @param      {Array}     args     Array of arguments to pass
 */
function exec(func, context, args) {
  var res

  switch (args.length) {
    case 0:
      res = func.call(context)
      break
    case 1:
      res = func.call(context, args[0])
      break
    case 2:
      res = func.call(context, args[0], args[1])
      break
    case 3:
      res = func.call(context, args[0], args[1], args[2])
      break
    case 4:
      res = func.call(context, args[0], args[1], args[2], args[3])
      break
    default:
      res = func.apply(context, args)
      break
  }

  return res
}

/**
 * Passes given query to 'this.exec' and shifts the first, mandatory, full match.
 * This function is added as a property to all RegExp-objects that passes Qbus.parse.
 *
 * @method     execQuery
 * @param      {String}  query   String execute
 * @return     {Null|Array>}     Null if it does not match, otherwise Array.
 */
function execQuery(query) {
  var match, i, arr

  if ((match = this.exec(query))) {
    arr = new Array(match.length - 1)

    for (i = 1; i < match.length; ++i) {
      arr[i - 1] = match[i]
    }

    return arr
  }

  return match
}

/**
 * Converts given expression to RegExp.
 * If a RegExp is given it will copy it and add 'execQuery' to its properties.
 *
 * @method     emit
 * @param      {String|RegExp}  expr   The string to convert or RegExp to add 'execQuery'.
 * @return     {RegExp}
 */
function parse(expr) {
  var finalRegexp, strSlashPref

  if (typeof expr !== 'string') {
    // Handle RegExp `expr`
    if (expr instanceof RegExp) {
      finalRegexp = new RegExp(expr)
      finalRegexp.query = execQuery

      return finalRegexp
    }

    throw new TypeError(
      'Usage: qbus.parse(<`query` = String|RegExp>)\n' +
        'Got:   qbus.parse(<`' +
        typeof expr +
        '` = ' +
        expr +
        '>)'
    )
  }

  strSlashPref = expr[expr.length - 1] === '/'

  // Trim slashes and remove doubles
  expr = normalizePath(expr)

  // Pass everything from and including possible beginning frontslash
  // until and not including the next frontslash, to `parseLevel`.
  expr = expr.replace(/\/?[^\/]+?(?=\/|$)/g, function(match, index) {
    // Return level if it doesn't contain any modifiers.
    // : must be preceeded by / or start of string to count
    // ? must be used with valid : to count (so we don't need to check for that)
    // * always counts
    if (match.indexOf('*') === -1 && (match.length <= 2 || !/(^|\/)+\:+?/.test(match))) {
      return match.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')
    }

    var slashSuff = match[0] === '/' ? '/' : '',
      slashPref = !!expr[match.length + index] || strSlashPref,
      level = slashSuff ? match.substr(1) : match,
      firstChar = level[0],
      lastChar = level.substr(-1)

    // Handle captures
    if (firstChar === ':') {
      // Handle optional :capture?
      if (lastChar === '?') {
        // Wrap any preceding slash in the optional capture group
        return slashSuff ? '(?:/([^/]+?))?' : '([^/]+?)?'
      }

      // Handle mandatory :capture
      return slashSuff + '([^/]+?)'
    }

    // All matches that end with a slash or does not end with * are easy.
    // We'll just choose to capture anything except a frontslash.
    //
    // /some/stuff*/   =>   /some/stuff([^/]+)?/
    // /some/st*ff/    =>   /some/st([^/]+)?ff/
    if (slashPref || lastChar !== '*') {
      return slashSuff + level.replace(/\*/g, '([^/]+)?')
    }

    // Handle all matches that ends with * and are not followd by frontslash; 'stuff*', '*'.
    // We'll replace all asterisks except the last with catch-alls. The last one is omitted and replaced with
    // a pattern that matches everything up until, but not included, the last frontslash in the string or end-of-string.
    //
    // /some/stuff* => some/stuff(.*?(?:(?=\/$)|(?=$)))?
    // /some/st*ff* => some/st(.*)?ff(.*?(?:(?=\/$)|(?=$)))?
    // /*           => (.*?(?:(?=\\/$)|(?=$)))?
    return slashSuff + level.replace(/\*(?!$)/g, '(.*)?').slice(0, -1) + '(.*?(?:(?=/$)|(?=$)))?'
  })

  // Create RegExp object from the parsed query
  finalRegexp = new RegExp('^/?' + expr + '/?$', 'i')

  // Add `execQuery` to it's properties
  finalRegexp.query = execQuery

  return finalRegexp
}

/**
 * Extracts the static portion of a query; i.e. everything up until a modifier.
 * /*                     = /
 * /get/some/:stuff?/     = /get/some
 * /get/some/*            = /get/some
 * /get/some/stu*         = /get/some
 * /get/some/stuff/       = /get/some/stuff
 *
 * @param  {String} query The query to extract the static portion of
 * @return {String}       The static portion of the query given
 */
function getFixed(query) {
  var fixed, iOP, iOW

  // Search for the the first occurence of a wildcard or capture portion
  iOP = query.search(/(^|\/)+?:+?[^\/]+?/)
  iOW = query.search(/(^|\/)+?[^\/]*?\*{1}/)

  // Both negative - static query
  if (iOP === -1 && iOW === -1) {
    return query
  }

  // Extract static portion
  fixed = query.substr(
    0,
    Math.min(iOP !== -1 ? iOP : query.length, iOW !== -1 ? iOW : query.length)
  )

  // Pop slash
  if (fixed[fixed.length - 1] === '/') {
    fixed = fixed.substr(0, fixed.length - 1)
  }

  return fixed
}

export default class Qbus {
  constructor(parent) {
    const qbus = {
      paths: {},
      parse: parse,
      parent: parent || null,
    }

    this.qbus = qbus
    Object.defineProperty(this, 'qbus', { enumerable: false, value: qbus })
  }

  /**
   * Attaches a new query handler for the given function.
   *
   * @method     on
   * @param      {String|RegExp}  expr     Expression to match against. String or a RegExp object
   * @param      {Function}       handler  A function to execute when the expression is matched.
   * @return     {Object}  `this`
   */
  on(expr, handler) {
    var paths = this.qbus.paths,
      normal,
      fixed,
      isRegExp = expr instanceof RegExp

    if ((!isRegExp && typeof expr !== 'string') || typeof handler !== 'function') {
      throw new TypeError(
        'Usage: qbus.on(<`expr` = String|RegExp>, <`handler` = Function>)\n' +
          'Got:   qbus.on(<`' +
          typeof expr +
          '` = ' +
          expr +
          '>, <`' +
          typeof handler +
          '` = ' +
          handler +
          '>)'
      )
    }

    // Handle RegExp queries
    if (isRegExp) {
      ;(paths['/'] || (paths['/'] = [])).push({
        input: expr.source,
        handler: handler,
        expr: parse(expr),
      })

      return this
    }

    // Trim slashes and remove doubles
    normal = normalizePath(expr)

    // Get the static portion of the expression or fallback on '/'.
    fixed = getFixed(normal) || '/'

    // Create namespace
    if (!paths[fixed]) {
      paths[fixed] = []
    }

    // All done
    paths[fixed].push({
      input: normal,
      handler: handler,

      // If the fixed portion of the expr equals the normal
      // then this is a simple, non-regexp expr that can use string comparison.
      expr: normal === fixed ? normal : parse(expr),
    })

    return this
  }

  /**
   * Attaches a new query handler for the given function.
   * The query handler will only be called once.
   *
   * @method     on
   * @param      {String|RegExp}  expr     Expression to match against. String or a RegExp object
   * @param      {Function}       handler  A function to execute when the expression is matched.
   * @return     {Object}  `this`
   */
  once(expr, handler) {
    var self = this

    if (typeof handler !== 'function' || (typeof expr !== 'string' && !(expr instanceof RegExp))) {
      throw new TypeError(
        'Usage: qbus.once(<`expr` = String|RegExp>, <`handler` = Function>)\n' +
          'Got:   qbus.once(<`' +
          typeof expr +
          '` = ' +
          expr +
          '>, <`' +
          typeof handler +
          '` = ' +
          handler +
          '>)'
      )
    }

    return this.on(expr, function temp() {
      var i = 0,
        args = new Array(arguments.length)

      for (; i < args.length; ++i) {
        args[i] = arguments[i]
      }

      self.off(expr, temp)
      exec(handler, self, args)
    })
  }

  /**
   * Removes all subscriptions matching `expr` and the optional `handler` function.
   *
   * @method     off
   * @param      {String|RegExp}  expr     Expression to match
   * @param      {Function=}  handler      Function to match
   * @return     {Object}                  `this`
   */
  off(expr, handler) {
    var paths = this.qbus.paths,
      isRegExp,
      parent,
      i

    if (
      (typeof expr !== 'string' && !(isRegExp = expr instanceof RegExp)) ||
      (typeof handler !== 'undefined' && typeof handler !== 'function')
    ) {
      throw new TypeError(
        'Usage: qbus.off(<`expr` = String|RegExp>[, <`handler` = Function>])\n' +
          'Got:   qbus.off(<`' +
          typeof expr +
          '` = ' +
          expr +
          '>, <`' +
          typeof handler +
          '` = ' +
          handler +
          '>)'
      )
    }

    let updatePaths

    // Convert RegExp' queries to strings
    if (isRegExp) {
      expr = expr.source
      parent = paths['/']
      updatePaths = newPaths => (paths['/'] = newPaths)
    } else {
      expr = normalizePath(expr)
      parent = paths[getFixed(expr) || '/']
      updatePaths = newPaths => (paths[getFixed(expr) || '/'] = newPaths)
    }

    if (parent) {
      parent = parent.filter(({ handler: fn, input }) => {
        if (input === expr && (!fn || fn === handler)) {
          return false
        } else {
          return true
        }
      })
      updatePaths(parent)
    }

    return this
  }

  /**
   * Executes all stored handlers that has an expression that matches `query`.
   *
   * @method     emit
   * @param      {String}  query   The string to match against
   * @return     {Object}          `this`
   */
  emit(query) {
    var paths = this.qbus.paths,
      i,
      x,
      sub,
      match,
      args = [],
      parent,
      needle,
      returned,
      slashEnd,
      normal,
      argsLen = arguments.length

    // Get all arguments after `query` as a regular array
    if (argsLen > 1) {
      for (i = 1; i < argsLen; ++i) {
        args.push(arguments[i])
      }
    }

    // Typecheck after converting the arguments to a regular array so we can include `args` in the message.
    // Dropping the `arguments` bomb causes V8 bailout: Bad value context for arguments value.
    if (typeof query !== 'string') {
      throw new TypeError(
        'Usage: qbus.emit(<`query` = String>[, <`arg1` = *>], <`arg2` = *>, ...)\n' +
          'Got:   qbus.emit(<`' +
          typeof query +
          '` = ' +
          query +
          '>, ' +
          args +
          ')'
      )
    }

    slashEnd = query[query.length - 1] == '/' ? '/' : ''

    // `needle` will be modified while we look for listeners so
    // `normal` will be the value that we'll compare against.
    needle = normal = normalizePath(query)

    // Skip a do...while by setting `needle` to '/' if it's empty.
    // It will be empty if the query equaled '/' before normalizePath trimmed the slashes.
    needle = needle || '/'

    while (needle) {
      parent = paths[needle]

      if (parent) {
        for (i = 0; i < parent.length; ++i) {
          sub = parent[i]

          // RegExp matching
          if (sub.expr.query) {
            if ((match = sub.expr.query(normal + slashEnd))) {
              // Extend `args` into matches
              for (x = 0; x < args.length; ++x) {
                match.push(args[x])
              }

              returned = exec(sub.handler, this, match)
            }
          }

          // String comparison
          else if (normal == sub.expr) {
            returned = exec(sub.handler, this, args)
          }

          // Discontinue if a handler returned false
          if (returned === false) {
            return this
          }
        }
      }

      // Break after processing '/'
      if (needle.length === 1) {
        break
      }

      // For each run we pop a part of the needle
      // 'foo/bar/baz'.substr(0, 7) => foo/bar
      // 'foo/bar'
      // 'foo'
      // ''
      //
      // By looping it backwards we let the most explicit listeners
      // have a running chance to break the loop by returning false.
      //
      // They are also guaranteed to be executed before a less explicit
      // listener breaks the loop.
      needle = needle.substr(0, needle.lastIndexOf('/')) || '/'
    }

    // Bubble
    if (this.qbus.parent) {
      this.qbus.parent.emit.apply(this.qbus.parent, arguments)
    }

    return this
  }
}

export function attach(host, emitter) {
  emitter = emitter || new Qbus()

  const add = name => {
    Object.defineProperty(host, name, {
      value: emitter[name].bind(emitter),
    })
  }

  add('on')
  add('off')
  add('emit')
  add('once')

  return host
}

// Add parse as a property to the constructor
Qbus.parse = parse
