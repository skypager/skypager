module.exports = function(app) {
  const { runtime } = this
  const mdxParser = require('@skypager/helpers-mdx/parser')

  app.post('/mdx', async (req, res) => {
    const { content, filename = '/docs/main.md' } = req.body

    if (!content || !content.length) {
      res.status(400).json({
        error: 'Must include content',
      })
      return
    }

    try {
      let rehypeAst
      
      const parsed = await mdxParser(content, {
        filePath: filename,
        rehypePlugins:  [
          () => tree => {
            rehypeAst = tree
            return tree
          },          
        ]
      })

      res.status(200).json({
        content,
        parsed,
        rehypeAst
      })
    } catch (error) {
      runtime.error(`Error parsing mdx`, error)
      res.status(500).json({
        message: error.message,
      })
    }
  })

  return app
}
