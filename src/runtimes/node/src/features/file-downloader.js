export const createGetter = 'fileDownloader'

export const featureMethods = ['download', 'downloadAsync']

export const featureMixinOptions = {
  partial: false,
  insertOptions: false,
}

export async function downloadAsync(sourceUrl, destinationPath) {
  const { runtime: skypager } = this

  const dest = skypager.resolve(destinationPath)
  await skypager.fsx.ensureDirAsync(skypager.pathUtils.dirname(dest))

  const req = new Promise((resolve, reject) => {
    this.download(sourceUrl, dest, (err, loc) => {
      err ? reject(err) : resolve(loc || dest)
    })
  })

  return await req.catch(e => false).then(l => l || dest)
}

export function download(sourceUrl, dest, cb) {
  const { runtime: skypager } = this
  const file = require('fs').createWriteStream(dest)
  const transport = sourceUrl.startsWith('https') ? require('https') : require('http')

  try {
    const request = transport.get(sourceUrl, response => {
      response.pipe(file)

      file.on('finish', () => {
        console.log('file finished')
        file.close(() => cb(null, dest))
      })
    })

    request.on('error', err => {
      skypager.error('Received error while downloading', { message: err.message })

      skypager.fsx
        .unlinkAsync(dest)
        .then(() => {
          cb && typeof cb === 'function' && cb(err)
        })
        .catch(e => {
          skypager.error(`Error while removing temp file`, { message: e.message })
          cb && typeof cb === 'function' && cb(e)
        })
    })
  } catch (e) {
    cb && typeof cb === 'function' && cb(e)
  }
}
