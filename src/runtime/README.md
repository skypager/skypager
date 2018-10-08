# Skypager Runtime

This is the core Skypager Runtime, which is made up of:

- the [base Runtime class](src/runtime.js)
- the [base Helper class](src/helpers/helper.js)
- the [Feature Helper](src/helpers/feature.js)

In addition to these base framework classes, it provides a number of utilities used by the base framework:

- [Event Emitter](src/utils/emitter.js)
- [Entity](src/utils/entity.js)
- [String Inflection](src/utils/inflect.js)
- [Middleware Pipelines](src/utils/mware.js)
- [Object Hashing](src/utils/object-hash.js)
- [Path Matcher](src/utils/path-matcher.js)
- [Property Utils](src/utils/properties.js)
- [Array Query](src/utils/query.js)
- [String Utils](src/utils/string.js)