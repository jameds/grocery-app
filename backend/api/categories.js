import express from 'express'
import { db } from '../db.js'
import { hasKeys } from '../util.js'

export const router = express.Router()

router.get('/', (req, res) => {
  res.json({ data:
    db.prepare('select * from categories').all() })
})

router.post('/', (req, res) => {
  if (!hasKeys(req.body, ['name', 'priority']))
    return res.status(400)
      .json({ error: 'wrong format' })

  const id = (db.transaction((data) => {
    db.prepare(
      `insert or replace into categories
      (id, name, priority) values
      ((select id from categories where name=@name),
      @name, @priority)`)
      .run(data)

    return db.prepare(
      'select id from categories where name=?')
      .pluck()
      .get(data.name)
  }))(req.body)

  res.json({ id })
})

router.put('/:id', (req, res) => {
  if (!hasKeys(req.body, ['name', 'priority']))
    return res.status(400)
      .json({ error: 'wrong format' })

  const { changes } = db.prepare(
    `update categories
    set name = @name, priority = @priority
    where id=@id`)
    .run({ ...req.body, ...req.params })

  if (changes)
    res.json({})
  else
    res.status(404).json({ error: 'not found' })
})
