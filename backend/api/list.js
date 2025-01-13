import { appendFileSync } from 'node:fs'
import express from 'express'
import { db } from '../db.js'
import { hasKeys } from '../util.js'

export const router = express.Router()

router.post('/', (req, res) => {
  if (!Array.isArray(req.body))
    return res.status(400)
      .json({ error: 'wrong format' })

  const table = req.body.flatMap(i =>
    hasKeys(i, ['id', 'name', 'quantity']) ?
    [[String(i.name), i.quantity]] : [])

  const maxName = table.reduce(
    (acc, [name]) => Math.max(acc, name.length), 0)

  const tableAlignedText = table.map(
    ([name, quantity]) =>
    `  ${name.padEnd(maxName)} ${quantity}`).join('\n')

  const d = new Date()

  const listId = [
    d.getFullYear(), '-',
    String(d.getMonth() + 1).padStart(2, '0'), '-',
    String(d.getDate()).padStart(2, '0'),
    '.txt'
  ].join('')

  appendFileSync([
    process.env.APP_DATA_DIR, '/lists/', listId
  ].join(''), [
    '-- ',
    String(d.getHours()).padStart(2, '0'), ':',
    String(d.getMinutes()).padStart(2, '0'),
    ' --\n',
    tableAlignedText, '\n'
  ].join(''))

  res.json({ id: listId })
})
