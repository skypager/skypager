export default (async function(chain, options = {}) {
  const skypager = this

  return chain
    .plant(skypager.fileManager)
    .result('files.values', [])
    .keyBy(value => skypager.fileManager.toFileId(value))
    .mapValues((v, fileId) => {
      return {
        hash: v.hash,
        mtime: v.mtime,
        fileId,
        relativePath: skypager.relative(skypager.cwd, v.path),
        size: v.size,
      }
    })
    .thru(files => {
      return {
        cwd: skypager.cwd,
        gitInfo: skypager.gitInfo,
        baseFolder: skypager.fileManager.baseFolder,
        files,
        directories: skypager.fileManager.directories.values().reduce(
          (memo, d) => ({
            ...memo,
            [d.key]: { directoryId: d.key, mtime: d.mtime, path: d.path },
          }),
          {}
        ),
        packages: skypager.fileManager.packageLocations.map(p => p.replace(/\/package.json/, '')),
      }
    })
})
