import type { Request, Response } from 'express'
import { loginAdmin } from '../services/admin-auth.service.js'

export async function login(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const { username, password } = req.body

    if (!username || !password) {
      res.status(400).json({
        success: false,
        message: 'Username and password are required',
      })
      return
    }

    const result = await loginAdmin(
      username,
      password,
    )

    res.json({
      success: true,
      message: 'Login successful',
      data: result,
    })
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Login failed'

    const statusCode =
      message === 'Admin account is disabled'
        ? 403
        : 401

    res.status(statusCode).json({
      success: false,
      message,
    })
  }
}
