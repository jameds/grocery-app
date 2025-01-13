import { mkdirSync } from 'node:fs'
import express from 'express'
import { router as apiRouter } from './api.js'

[
  '/lists',
].map(p => process.env.APP_DATA_DIR + p)
  .forEach(p => mkdirSync(p, { recursive: true }))

const app = express()

app.use(express.json())
app.use('/api', apiRouter)
app.use('/lists',
  express.static(process.env.APP_DATA_DIR + '/lists'))

app.use((req, res, next) => {
	res.status(404).json({ error: 'not found' })
})

app.use((err, req, res, next) => {
  // https://github.com/expressjs/express/issues/4065#issuecomment-536151203
  if (err instanceof SyntaxError &&
    err.status === 400 && 'body' in err)
  {
    return res.status(400).send({ error: err.message })
  }

	console.error(err)
	res.status(500).json({ error: 'server error' })
})

app.listen(process.env.APP_PORT)
