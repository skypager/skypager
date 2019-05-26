const retext = require('retext')
const keywords = require('retext-keywords')

const keywordParser = retext().use(keywords)

const parse = (content) =>
  keywordParser.parse(content, (err, file) => (err ? reject(err) : resolve(file)))

const process = async content =>
  new Promise((resolve, reject) =>
    keywordParser.process(content, (err, file) => (err ? reject(err) : resolve(file)))
  )

module.exports = function(app) {
  const { runtime } = this

  app.post('/keywords', async (req, res) => {
    const { content } = req.body

    if (!content || !content.length) {
      res.status(400).json({
        error: 'Must include content',
      })
      return
    }


    try {
      const processed = await process(content)
      const ast = parse(content)

      res.status(200).json({
        content,
        ...processed.data,
        messages: processed.messages,
        ast
      })
    } catch (error) {
      runtime.error(`Error parsing content`, error)
      res.status(500).json({
        message: error.message,
      })
    }
  })

  return app
}
