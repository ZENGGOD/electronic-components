import type { Request, Response } from 'express'

import {
  getManufacturers,
} from '../services/manufacturer.service.js'

export async function listManufacturers(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const manufacturers = await getManufacturers()

    res.json({
      success: true,
      data: manufacturers,
      total: manufacturers.length,
    })
  } catch (error) {
    console.error('Failed to fetch manufacturers:', error)

    res.status(500).json({
      success: false,
      message: 'Failed to fetch manufacturers',
    })
  }
}
