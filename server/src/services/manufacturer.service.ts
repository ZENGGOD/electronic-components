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
  productCount: number
  createdAt?: Date
  updatedAt?: Date
}

export async function getManufacturers(): Promise<ManufacturerRow[]> {
  const sql = `
    SELECT
      m.id,
      m.name,
      m.code,
      m.logo_url AS logoUrl,
      m.website,
      m.description,
      m.status,
      m.sort_order AS sortOrder,
      COUNT(p.id) AS productCount,
      m.created_at AS createdAt,
      m.updated_at AS updatedAt
    FROM manufacturers m
    LEFT JOIN products p
      ON p.manufacturer_id = m.id
      AND p.status <> 'Discontinued'
    WHERE m.status = 1
    GROUP BY
      m.id,
      m.name,
      m.code,
      m.logo_url,
      m.website,
      m.description,
      m.status,
      m.sort_order,
      m.created_at,
      m.updated_at
    ORDER BY
      m.sort_order ASC,
      m.id ASC
  `

  const [rows] = await pool.query<ManufacturerRow[]>(sql)

  return rows
}
