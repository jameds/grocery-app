import express from 'express'
import { router as listRouter } from './api/list.js'
import { router as itemsRouter } from './api/items.js'
import {
  router as categoriesRouter } from './api/categories.js'

export const router = express.Router()

router.use('/list', listRouter)
router.use('/items', itemsRouter)
router.use('/categories', categoriesRouter)
