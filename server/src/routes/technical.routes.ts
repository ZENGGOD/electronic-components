import { Router } from 'express'

import {
  listTechnicalTopics,
  getTechnicalTopic,
} from '../controllers/technical.controller.js'

const router = Router()

router.get('/', listTechnicalTopics)

router.get('/:slug', getTechnicalTopic)

export default router
