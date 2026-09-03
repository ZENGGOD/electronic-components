import type { RowDataPacket } from 'mysql2'
import pool from '../config/database.js'

export interface ManufacturerRow extends RowDataPacket {
  id: number
  name: string
  code: string | null
  logoUrl: string | null
  website: string | null
  description: string | null
  status: number
  sortOrder: number
  createdAt?: Date
  updatedAt?: Date
}

export async function getManufacturers(): Promise<ManufacturerRow[]> {
  const sql = `
    SELECT
      id,
      name,
      code,
      logo_url AS logoUrl,
      website,
      description,
      status,
      sort_order AS sortOrder,
      created_at AS createdAt,
      updated_at AS updatedAt
    FROM manufacturers
    WHERE status = 1
    ORDER BY
      sort_order ASC,
      id ASC
  `

  const [rows] = await pool.query<ManufacturerRow[]>(sql)

  return rows
}
