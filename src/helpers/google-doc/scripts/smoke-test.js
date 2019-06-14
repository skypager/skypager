const runtime = require('@skypager/node')
const GoogleDocHelper = require('@skypager/helpers-google-doc')

const pathToServiceAccount = process.env.GOOGLE_APPLICATION_CREDENTIALS || runtime.resolve('secrets', 'serviceAccount.json') 
const serviceAccount = require(pathToServiceAccount)
const googleProject = process.env.GCLOUD_PROJECT || serviceAccount.project_id

runtime.use(GoogleDocHelper, {
  serviceAccount: pathToServiceAccount,
  googleProject
})

main()

async function main() {
  await runtime.googleDocs.discover({ includeTeamDrives: true })

  const firstAvailable = runtime.googleDocs.available[0]
  const googleDoc = runtime.googleDoc(firstAvailable)

  await googleDoc.load()

  const { 
    // the title of your doc
    title,
    // all of the content nodes 
    contentNodes = [],
    // all the heading nodes
    headingNodes = [],
    // all the paragraph nodes
    paragraphNodes = [], 
    // all the lists
    lists = [], 
    // all the tables
    tables = [] ,
    // all of the styles (e.g. heading 1, heading 2)
    namedStyles = {}
  } = googleDoc

  console.log({ 
    title, 
    namedStyles,
    contentNodes: contentNodes.length, 
    headingNodes: headingNodes.length, 
    lists: lists.length,
    namedStyles: Object.keys(namedStyles).length
  })
}