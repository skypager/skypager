import runtime from '@skypager/node'

const { defineTable, print } = runtime.cli

const filesTable = defineTable('filesTable', {
  head: ['Name', 'Type', 'ID'],
})

export async function main(subcommands = [], options = {}) {
  const { google } = runtime

  await google.whenReady()

  if ((options.server && !google.auth) || (!options.server && !google.oauthClient)) {
    throw new Error(
      `Command requires an authenticated oauth client, or server to server auth setup`
    )
  }
}

main.help = help

export function help(commands = [], options = {}) {
  console.log('folders list help')
}

export default main
