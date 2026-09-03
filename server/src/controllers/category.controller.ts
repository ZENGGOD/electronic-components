import type { Request, Response } from 'express'

import {
  getCategories,
} from '../services/category.service.js'

export async function listCategories(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const categories = await getCategories()

    res.json({
      success: true,
      data: categories,
      total: categories.length,
    })
  } catch (error) {
    console.error('Failed to fetch categories:', error)

    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories',
    })
  }
}
