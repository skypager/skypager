const runtime = require('@skypager/node')
const axios = require('axios')

const port = runtime.argv.port || process.env.PORT || 3000

main()

async function main() {
  console.log(`Running API Tests against port ${port}`)
  await Promise.all([
    testVM().then(() => console.log('VM Test OK')),
    testMdx().then(() => console.log('MDX Test OK')),
    testKeywords().then(() => console.log('Keywords Test OK')),
  ]).catch(error => {
    console.error(error.message)
    process.exit(1)
    return false
  })

  return true
}

async function testKeywords() {
  const testContent = `
    I want to create a new website.
    it should use the "dark theme".
    it should have a Home Page, an About Page, a Contact Us Page 
    it should have an about page
    it should have a contact us page
    the home page should use the two column layout 
    the left column should use the fancy navigation component
    the right column should contain content from the news feed
  `

  const response = await axios
    .post(`http://localhost:${port}/keywords`, {
      content: testContent,
    })
    .catch(error => {
      if (error.response) {
        const { status, data } = error.response
        if (status !== 404) {
          console.error({ response: data })
        }
        throw new Error(`Request to http://localhost:${port}/keywords failed with status ${status}`)
      } else {
        throw error
      }
    })

  const { data, status } = response

  if (status !== 200) {
    console.error('Expected 200 Status response from /vm')
    return false
  }

  if (!data.messages || !data.keywords || !data.keyphrases || !data.ast) {
    console.log(JSON.stringify(data, null, 2))
    console.error('expected response to have keywords keyphrases and messages')
    return false
  }
}

async function testVM() {
  const testBabelCode = `
  import runtime from '@skypager/node'

  const things = [1,2,3,4,5]

  async function main() {
    return true
  }

  main()
  `

  const response = await axios
    .post(`http://localhost:${port}/vm`, {
      content: testBabelCode,
      transpile: true,
      name: 'test-babel',
    })
    .catch(error => {
      if (error.response) {
        const { status, data } = error.response
        if (status !== 404) {
          console.error({ response: data })
        }
        throw new Error(`Request to http://localhost:${port}/vm failed with status ${status}`)
      } else {
        throw error
      }
    })

  const { data, status } = response

  if (status !== 200) {
    console.error('Expected 200 Status response from /vm')
    return false
  }

  if (!data || !data.instructions) {
    console.error('Expected to receive instructions data from /vm')
    return false
  }

  return true
}

async function testMdx() {
  const testMdxCode = `
  # Hello World
  > nice

  **How are you**?

  ## Subheading

  ### Subheading 2
  ### Subheading 3
  `

  const response = await axios
    .post(`http://localhost:${port}/mdx`, {
      content: testMdxCode,
      transpile: true,
      name: 'test-babel',
    })
    .catch(error => {
      if (error.response) {
        const { status, data } = error.response
        if (status !== 404) {
          console.error({ response: data })
        }
        throw new Error(`Request to http://localhost:${port}/mdx failed with status ${status}`)
      } else {
        throw error
      }
    })
  const { data, status } = response

  if (status !== 200) {
    console.error('Expected 200 Status response from /mdx')
    return false
  }

  if (!data || !data.parsed) {
    console.error('Expected to receive data from /mdx')
    return false
  }

  return true
}
