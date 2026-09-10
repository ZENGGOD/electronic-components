import { Router } from 'express'

import { authenticateAdmin } from '../middlewares/admin-auth.middleware.js'

import {
  getContactMessages,
  getContactMessage,
  updateContactMessage,
  deleteContactMessage,
} from '../controllers/contact-message.controller.js'

const router = Router()

/**
 * 获取客户留言列表
 *
 * GET /api/admin/contact-messages
 */
router.get(
  '/',
  authenticateAdmin,
  getContactMessages,
)

/**
 * 获取客户留言详情
 *
 * GET /api/admin/contact-messages/:id
 */
router.get(
  '/:id',
  authenticateAdmin,
  getContactMessage,
)

/**
 * 修改客户留言
 *
 * PUT /api/admin/contact-messages/:id
 */
router.put(
  '/:id',
  authenticateAdmin,
  updateContactMessage,
)

/**
 * 删除客户留言
 *
 * DELETE /api/admin/contact-messages/:id
 */
router.delete(
  '/:id',
  authenticateAdmin,
  deleteContactMessage,
)

export default router
