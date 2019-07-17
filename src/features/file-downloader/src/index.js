import * as fileDownloader from './file-downloader.js'

export function attach(runtime) {
  runtime.features.register('file-downloader', () => fileDownloader)
}
