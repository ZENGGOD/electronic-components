import type { Request, Response } from 'express'

import {
  getTechnicalTopics,
  getTechnicalTopicBySlug,
} from '../services/technical.service.js'

/**
 * GET /api/technical
 */
export async function listTechnicalTopics(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const topics = await getTechnicalTopics()

    res.json({
      success: true,
      data: topics,
      total: topics.length,
    })
  } catch (error) {
    console.error(
      'Failed to fetch technical topics:',
      error,
    )

    res.status(500).json({
      success: false,
      message: 'Failed to fetch technical topics',
    })
  }
}

/**
 * GET /api/technical/:slug
 */
export async function getTechnicalTopic(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const rawSlug = req.params.slug

    const slug =
      typeof rawSlug === 'string'
        ? rawSlug.trim()
        : undefined

    if (!slug) {
      res.status(400).json({
        success: false,
        message: 'Technical topic slug is required',
      })

      return
    }

    const topic =
      await getTechnicalTopicBySlug(slug)

    if (!topic) {
      res.status(404).json({
        success: false,
        message: 'Technical topic not found',
      })

      return
    }

    res.json({
      success: true,
      data: topic,
    })
  } catch (error) {
    console.error(
      'Failed to fetch technical topic:',
      error,
    )

    res.status(500).json({
      success: false,
      message: 'Failed to fetch technical topic',
    })
  }
}
