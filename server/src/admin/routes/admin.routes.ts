import { Router } from 'express'

import { authenticateAdmin } from '../middlewares/admin-auth.middleware.js'

const router = Router()

router.get(
  '/profile',
  authenticateAdmin,
  (_req, res) => {
    res.json({
      success: true,
      message: 'Admin authentication successful',
      data: res.locals.admin,
    })
  },
)

export default router
