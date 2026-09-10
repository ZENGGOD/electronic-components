import { Router } from 'express'

import {
  createManufacturer,
  deleteManufacturer,
  getManufacturer,
  getManufacturers,
  updateManufacturer,
} from '../controllers/manufacturer.controller.js'

import {
  authenticateAdmin,
} from '../middlewares/admin-auth.middleware.js'

const router = Router()

/**
 * GET /api/admin/manufacturers
 *
 * 获取厂商列表
 */
router.get(
  '/',
  authenticateAdmin,
  getManufacturers,
)

/**
 * GET /api/admin/manufacturers/:id
 *
 * 获取单个厂商
 */
router.get(
  '/:id',
  authenticateAdmin,
  getManufacturer,
)

/**
 * POST /api/admin/manufacturers
 *
 * 创建厂商
 */
router.post(
  '/',
  authenticateAdmin,
  createManufacturer,
)

/**
 * PUT /api/admin/manufacturers/:id
 *
 * 修改厂商
 */
router.put(
  '/:id',
  authenticateAdmin,
  updateManufacturer,
)

/**
 * DELETE /api/admin/manufacturers/:id
 *
 * 删除厂商
 */
router.delete(
  '/:id',
  authenticateAdmin,
  deleteManufacturer,
)

export default router

