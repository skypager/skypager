export async function main(commands = [], options = {}) {

}

export function help(commands, options = {}) {
  console.log('docs create help')
}

main.help = help

export default main