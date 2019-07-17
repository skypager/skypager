import * as childProcessAdapter from '@skypager/features-child-process-adapter'
import * as featureFinder from '@skypager/features-feature-finder'
import * as fileDownloader from '@skypager/features-file-downloader'
import * as fsAdapter from '@skypager/features-fs-adapter'
import * as git from '@skypager/features-git'
import * as homeDirectory from '@skypager/features-home-directory'
import * as logging from '@skypager/features-logging'
import * as mainScript from '@skypager/features-main-script'
import * as matcher from '@skypager/features-matcher'
import * as networking from '@skypager/features-networking'
import * as opener from '@skypager/features-opener'
import * as osAdapter from '@skypager/features-os-adapter'
import * as packageCache from '@skypager/features-package-cache'
import * as packageFinder from '@skypager/features-package-finder'
import * as scriptRunner from '@skypager/features-script-runner'
import * as skywalker from '@skypager/features-skywalker'
import * as socket from '@skypager/features-socket'
import * as moduleFactory from '@skypager/features-module-factory'

export function attach(runtime) {
  runtime
    .use(childProcessAdapter)
    .use(featureFinder)
    .use(fileDownloader)
    .use(fsAdapter)
    .use(git)
    .use(homeDirectory)
    .use(logging)
    .use(mainScript)
    .use(matcher)
    .use(networking)
    .use(opener)
    .use(osAdapter)
    .use(packageCache)
    .use(packageFinder)
    .use(scriptRunner)
    .use(skywalker)
    .use(socket)
    .use(moduleFactory)
}
