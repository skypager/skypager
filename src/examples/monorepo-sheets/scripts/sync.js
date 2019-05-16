require('./install-secrets')

const host = require('@skypager/node')
const runtime = host.spawn({ cwd: host.gitInfo.root }).use('runtimes/node')

runtime.use(require('@skypager/helpers-sheet'), {
  serviceAccount: runtime.resolve('secrets', 'serviceAccount.json'),
  googleProject: 'skypager-4dab8',
})

const EMPTY = '$EMPTY'

async function main() {
  await runtime.fileManager.startAsync()
  await runtime.packageManager.startAsync()
  await runtime.sheets.discover()
  const { worksheet, projects } = await loadProjects()

  let packages = runtime.packageManager.allEntities.filter(
    ({ name }) => name && name.startsWith('@skypager/')
  )

  if (runtime.argv.only) {
    packages = packages.filter(p => p.name === runtime.argv.only)
  }

  if (runtime.argv.console) {
    await runtime.repl('interactive').launch({ runtime, packages, projects, worksheet })
    return
  }

  if (runtime.argv.inbound || runtime.argv._[0] === 'inbound') {
    console.log('Updating Local Packages from the Spreadsheet')
    await updateLocalPackages({ projects, worksheet, packages })
  } else {
    console.log('Updating the spreadsheet with local package info')
    await updateSheet({ projects, worksheet, packages })
  }
}

async function updateLocalPackages({ packages, worksheet, projects }) {
  for (let pkg of packages) {
    await syncPackage(pkg, projects.find(p => p.name === pkg.name))
  }
}

async function updateSheet({ projects, worksheet, packages }) {
  const { keyBy } = runtime.lodash

  const projectIndex = keyBy(projects, 'name')

  for (let pkg of packages) {
    await syncProject(pkg, { projectIndex, worksheet })
  }
}

async function syncPackage(localPackage, remoteProject) {
  const updated = []

  if (
    remoteProject.description !== localPackage.description &&
    remoteProject.description !== EMPTY
  ) {
    updated.push('description')
    localPackage.set('description', remoteProject.description)
  }

  if (remoteProject.homepage !== localPackage.homepage && remoteProject.homepage !== EMPTY) {
    updated.push('homepage')
    localPackage.set('homepage', remoteProject.homepage)
  }

  if (remoteProject.license !== localPackage.license && remoteProject.license !== EMPTY) {
    updated.push('license')
    localPackage.set('license', remoteProject.license)
  }

  if (localPackage.skypager) {
    if (remoteProject.type !== localPackage.skypager.projectType && remoteProject.type !== EMPTY) {
      updated.push('type')

      localPackage.set('skypager', {
        ...localPackage.skypager,
        projectType: remoteProject.type,
      })
    }

    if (
      remoteProject.category !== localPackage.skypager.category &&
      remoteProject.category !== EMPTY
    ) {
      updated.push('category')
      localPackage.set('skypager', {
        ...localPackage.skypager,
        category: remoteProject.category,
      })
    }
  }

  if (updated.length) {
    await localPackage.save()
    console.log(`Updated ${remoteProject.name}. Changed ${updated.join(',')}`)
  } else {
    //console.log(`Skipped ${remoteProject.name}. No changes.`)
  }
}

async function syncProject(packageMeta, { projectIndex: index = {}, worksheet = {} } = {}) {
  // until i fix a bug where empty cells don't get indexed
  const {
    name = EMPTY,
    skypager = {},
    version = EMPTY,
    description = EMPTY,
    license = 'MIT',
    homepage = EMPTY,
    keywords = [EMPTY],
  } = packageMeta

  const { projectType = EMPTY, category = EMPTY } = skypager

  if (index[name]) {
    const remoteProject = index[name]

    remoteProject.enableAutoSave()

    try {
      remoteProject.name = name
      remoteProject.version = version
      remoteProject.description = description && description.length ? description : EMPTY
      remoteProject.license = license && license.length ? license : EMPTY
      remoteProject.homepage = homepage && homepage.length ? homepage : EMPTY
      remoteProject.type = projectType
      remoteProject.category = category
      remoteProject.keywords = (keywords.length ? keywords : [EMPTY]).join('\n')
      console.log(`Updated ${name}`)
    } catch (error) {
      console.log(`Error updating ${name}: ${error.message}`)
    }

    return
  }

  console.log(`Adding ${name}`)
  const row = await worksheet.addRow({
    name,
    version,
    description: description && description.length ? description : EMPTY,
    license: license && license.length ? license : EMPTY,
    homepage: homepage && homepage.length ? homepage : EMPTY,
    type: projectType && projectType.length ? projectType : EMPTY,
    category: category && category.length ? category : EMPTY,
    keywords: (keywords.length ? keywords : [EMPTY]).join('\n'),
  })
}

async function loadProjects() {
  const monorepo = runtime.sheet('skypagermonorepo')

  monorepo.enableAutoSave()

  await entities(monorepo)

  const worksheet = await monorepo.ws('projects')

  const projects = worksheet.entities

  return {
    monorepo,
    worksheet,
    projects,
  }
}

function entities(sheet) {
  class Project extends sheet.RowEntity {}

  try {
    return sheet.registerEntity('projects', () => Project)
  } catch (error) {
    console.log(sheet.worksheetIds, sheet.worksheetTitles)
  }
}

main()
