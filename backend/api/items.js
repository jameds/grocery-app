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
  if (!hasKeys(req.body, ['name', 'category']))
    return res.status(400)
      .json({ error: 'wrong format' })

  const id = (db.transaction(({ name, id, ...data }) => {
    db.prepare(
      `insert or ignore into categories
      (name) values (?)`)
      .run(data.category)

    const categoryId = db.prepare(
      'select id from categories where name=?')
      .pluck()
      .get(data.category)

    data.category = categoryId

    var { lastInsertRowid: id } = db.prepare(
      `insert or replace into items
      (id, name, data) values
      ((select id from items where id=@id or name=@name),
      @name, @data)`)
      .run({ name, id, data: JSON.stringify(data) })

    return id
  }))(req.body)

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
