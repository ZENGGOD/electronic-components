import { Router } from 'express'

import {
  listManufacturers,
} from '../controllers/manufacturer.controller.js'

const router = Router()

router.get('/', listManufacturers)

export default router
