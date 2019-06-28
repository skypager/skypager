import runtime from '@skypager/node'
import googleCommand, { utils } from '../src/cli/command'

async function main() {
  await utils.setup()
  googleCommand()
}

main()
