import { Router } from 'express'

import {
  createContactMessageController,
} from '../controllers/contact-message.controller.js'

const router = Router()

/**
 * 前台提交客户留言
 *
 * POST /api/contact
 */
router.post(
  '/',
  createContactMessageController,
)

export default router

