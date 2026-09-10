import type {
  Request,
  Response,
  NextFunction,
} from 'express'

import jwt from 'jsonwebtoken'

export interface AdminJwtPayload {
  id: number
  username: string
  role: 'Super Admin' | 'Admin' | 'Editor'
}

const JWT_SECRET: string = process.env.JWT_SECRET || ''

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not configured')
}

export function authenticateAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  try {
    const authorization = req.headers.authorization

    if (!authorization) {
      res.status(401).json({
        success: false,
        message: 'Authorization token is required',
      })
      return
    }

    const [scheme, token] = authorization.split(' ')

    if (scheme !== 'Bearer' || !token) {
      res.status(401).json({
        success: false,
        message: 'Invalid authorization format',
      })
      return
    }

    const decoded = jwt.verify(
      token,
      JWT_SECRET,
    ) as AdminJwtPayload

    res.locals.admin = decoded

    next()
  } catch {
    res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
    })
  }
}
