import library from './library/index'

export default async function main() {
  await library.start()
  await library.repl('interactive').launch({ library })
}
