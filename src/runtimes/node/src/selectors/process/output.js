export default async function processOutput(chain, options = {}) {
  const output = await this.select("process/result", options)
  const { identity } = this.lodash

  const { stdout, stderr } = output

  const { format = "lines", outputOnly = true, filter = identity } = options

  const processor = format === "lines" ? out => out.trim().split("\n") : out => out.trim()

  const desiredOutput = outputOnly ? ({ stdout, stderr } = {}) => stdout : identity

  return chain.plant({ stdout, stderr }).mapValues(processor).thru(desiredOutput)
}
