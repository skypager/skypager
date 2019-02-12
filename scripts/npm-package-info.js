/**
 * TOKEN=$(curl -s \
  -H "Accept: application/json" \
  -H "Content-Type:application/json" \
  -X PUT --data '{"name": "username_here", "password": "password_here"}' \
  http://your_registry/-/user/org.couchdb.user:username_here 2>&1 | grep -Po \
  '(?<="token": ")[^"]*')
*/

const axios = require('axios')

main()

async function main() {
  const resp = await axios
    .put(
      'https://registry.npmjs.org/-/user/org.couchdb.user:soederpop',
      {
        name: process.env.NPM_USERNAME,
        password: process.env.NPM_PASSWORD,
      },
      {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      }
    )
    .catch(error => {
      console.log(error.config)
      console.log(error.response.status)
      console.log(error.response.data)
      process.exit(1)
    })

  console.log(resp.data)
}
