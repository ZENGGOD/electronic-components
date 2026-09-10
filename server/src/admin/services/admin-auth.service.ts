import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import type { RowDataPacket } from 'mysql2'
import pool from '../../config/database.js'

interface AdminUserRow extends RowDataPacket {
  id: number
  username: string
  password_hash: string
  display_name: string | null
  email: string | null
  role: 'Super Admin' | 'Admin' | 'Editor'
  status: number
  last_login_at: Date | null
  created_at: Date
}

export interface AdminLoginResult {
  token: string
  admin: {
    id: number
    username: string
    displayName: string | null
    email: string | null
    role: 'Super Admin' | 'Admin' | 'Editor'
  }
}

const JWT_SECRET: string = process.env.JWT_SECRET ?? ''

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not configured')
}

export async function loginAdmin(
  username: string,
  password: string,
): Promise<AdminLoginResult> {
  const [rows] = await pool.query<AdminUserRow[]>(
    `
      SELECT
        id,
        username,
        password_hash,
        display_name,
        email,
        role,
        status,
        last_login_at,
        created_at
      FROM admin_users
      WHERE username = ?
      LIMIT 1
    `,
    [username],
  )

  if (rows.length === 0) {
    throw new Error('Invalid username or password')
  }

  const admin = rows[0]

  if (admin.status !== 1) {
    throw new Error('Admin account is disabled')
  }

  const passwordValid = await bcrypt.compare(
    password,
    admin.password_hash,
  )

  if (!passwordValid) {
    throw new Error('Invalid username or password')
  }

  await pool.query(
    `
      UPDATE admin_users
      SET last_login_at = NOW()
      WHERE id = ?
    `,
    [admin.id],
  )

  const token = jwt.sign(
    {
      id: admin.id,
      username: admin.username,
      role: admin.role,
    },
    JWT_SECRET,
    {
      expiresIn: '7d',
    },
  )

  return {
    token,
    admin: {
      id: admin.id,
      username: admin.username,
      displayName: admin.display_name,
      email: admin.email,
      role: admin.role,
    },
  }
}
