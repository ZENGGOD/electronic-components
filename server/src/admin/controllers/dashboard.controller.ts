import type { Request, Response } from 'express'

import { getDashboardStats } from '../services/dashboard.service.js'

export async function getDashboard(
  _req: Request,
  res: Response,
): Promise<void> {
  try {
    const stats = await getDashboardStats()

    res.json({
      success: true,
      message: 'Dashboard data retrieved successfully',
      data: stats,
    })
  } catch (error) {
    console.error('Failed to fetch dashboard data:', error)

    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data',
    })
  }
}
