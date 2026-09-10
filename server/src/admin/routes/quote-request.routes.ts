import { Router } from 'express'

import { authenticateAdmin } from '../middlewares/admin-auth.middleware.js'

import {
  getQuoteRequests,
  getQuoteRequest,
  updateQuoteRequest,
  deleteQuoteRequest,
} from '../controllers/quote-request.controller.js'

const router = Router()

// 询价列表
router.get(
  '/',
  authenticateAdmin,
  getQuoteRequests,
)

// 询价详情
router.get(
  '/:id',
  authenticateAdmin,
  getQuoteRequest,
)

// 修改询价
router.put(
  '/:id',
  authenticateAdmin,
  updateQuoteRequest,
)

// 删除询价
router.delete(
  '/:id',
  authenticateAdmin,
  deleteQuoteRequest,
)

export default router
