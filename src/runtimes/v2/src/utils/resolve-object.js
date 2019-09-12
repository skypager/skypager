export default function resolveObject(objectOfPromises = {}) {
  const operations = Object.entries(objectOfPromises)
  return Promise.all(
    operations.map(([key, fn]) =>
      Promise.resolve(typeof fn === 'function' ? fn() : fn).then(result => [key, result])
    )
  ).then(pairs => pairs.reduce((memo, pair) => ({ ...memo, [pair[0]]: pair[1] }), {}))
}
