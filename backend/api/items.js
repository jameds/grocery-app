import express from 'express'
import { db } from '../db.js'
import { hasKeys } from '../util.js'

export const router = express.Router()

router.get('/', (req, res) => {
  res.json({ data:
    db.prepare('select * from items').all()
    .map(({ data, ...obj }) => ({
        ...JSON.parse(data), ...obj }))
  })
})

router.post('/', (req, res) => {
  if (!hasKeys(req.body, ['name']))
    return res.status(400)
      .json({ error: 'wrong format' })

  const { lastInsertRowid: id } = db.prepare(
    `insert or replace into items
    (name, data) values (?, ?)`)
    .run(...(({ name, ...data }) =>
        [name, JSON.stringify(data)])(req.body))

  res.json({ id })
})

router.delete('/:id', (req, res) => {
  const { changes } = db.prepare(
    'delete from items where id=?')
    .run(req.params.id)

  if (changes)
    res.json({})
  else
    res.status(404).json({ error: 'not found' })
})
