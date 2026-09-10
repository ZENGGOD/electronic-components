import { Router } from 'express'

import { getDashboard } from '../controllers/dashboard.controller.js'
import { authenticateAdmin } from '../middlewares/admin-auth.middleware.js'

const router = Router()

router.get(
  '/',
  authenticateAdmin,
  getDashboard,
)

export default router
