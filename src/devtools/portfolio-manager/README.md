# Skypager Portfolio Manager

Provides useful information and capabilities at a portfolio level for your monorepo.

Use it to aggregate information about each project, to run tasks in various projects, etc.

## Usage

```javascript
import runtime from '@skypager/node'
import PortfolioManager from '@skypager/portfolio-manager'

export default runtime.portfolio
```

## Examples

You can generate a dump of the portfolio state

```javascript
runtime.portfolio.dump().then((data) => {
  const {
    // a hash of the package.json contents
    packageHash,
    // a hash of the yarn.lock contents
    yarnLockHash,
    // the current git sha
    gitSha,
    // the current git branch
    gitBranch,
    // the os platform 
    platform,
    // the os arch
    arch,
    // if the portfolio uses lerna, which version is lerna.json set to
    lernaVersion,
    // info about the build state of all the projects in the portfolio
    projectTable
  } = data

  const projectTableEntry = projectTable['@skypager/web']

  // For each project, you'll get the following information
  const {
    // the name of the project
    projectName,
    // a composite md5 hash of all of the build folder output files hashes
    buildHash,
    // a composite md5 hash of all of the source files hashes
    sourceHash,
    // the last git sha and commit message when this project was updated
    lastUpdate,
    // an array of the files in the build folder, their md5 hash, last modified time, size, etc
    outputFiles
  }
})
```

You can spawn a node runtime inside one of the sub projects

```javascript
const nodeRuntimeInsideWebProject = runtime.portfolio.createRuntime('@skypager/web')
nodeRuntimeInsideWebProject.proc.execSync('pwd').toString() // ~/src/runtimes/web
```

You can calculate the source tree hash for just one project

```javascript
runtime.portfolio.hashProjectTree('@skypager/web')
```

You can calculate the build tree hash for just one project

```javascript
runtime.portfolio.hashBuildTree('@skypager/web')
```