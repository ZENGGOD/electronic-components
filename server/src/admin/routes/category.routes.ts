import { Router } from 'express'

import {
  createCategory,
  deleteCategory,
  getCategories,
  getCategory,
  updateCategory,
} from '../controllers/category.controller.js'

import {
  authenticateAdmin,
} from '../middlewares/admin-auth.middleware.js'

const router = Router()

router.get(
  '/',
  authenticateAdmin,
  getCategories,
)

router.get(
  '/:id',
  authenticateAdmin,
  getCategory,
)

router.post(
  '/',
  authenticateAdmin,
  createCategory,
)

router.put(
  '/:id',
  authenticateAdmin,
  updateCategory,
)

router.delete(
  '/:id',
  authenticateAdmin,
  deleteCategory,
)

export default router

