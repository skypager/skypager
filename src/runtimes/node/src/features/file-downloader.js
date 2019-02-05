import { Feature } from '@skypager/runtime/lib/feature'

/**
 * @class FileDownloaderFeature
 * @classdesc The File Downloader can download files from http(s) urls into the local path
 */
export default class FileDownloaderFeature extends Feature {
  static shortcut = 'fileDownloader'

  shortcut = 'fileDownloader'

  /**
   * Download a URL to a destination path
   *
   * @param {String} sourceUrl
   * @param {String} destinationPath
   * @memberof FileDownloaderFeature
   * @returns {PromiseLike<String>} absolute path to the saved file
   */
  async downloadAsync(sourceUrl, destinationPath) {
    const { runtime: skypager } = this

    const dest = skypager.resolve(destinationPath)
    await skypager.fsx.ensureDirAsync(skypager.pathUtils.dirname(dest))

    const req = new Promise((resolve, reject) => {
      this.download(sourceUrl, dest, (err, loc) => {
        err ? reject(err) : resolve(loc || dest)
      })
    })

    return Promise.resolve(req)
      .catch(e => false)
      .then(l => l || dest)
  }

  /**
   * Download a URL to a a destination
   * @param {String} sourceUrl
   * @param {String} destinationPath
   * @memberof FileDownloaderFeature
   * @param {Function} [callback] if you leave off the function, we'll give you the promise api of downloadSync
   */
  download(sourceUrl, dest, cb) {
    if (typeof cb !== 'function') {
      return this.downloadAsync(sourceUrl, dest)
    }

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
}
