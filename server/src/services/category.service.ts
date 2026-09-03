import type { RowDataPacket } from 'mysql2'
import pool from '../config/database.js'

export interface CategoryRow extends RowDataPacket {
  id: number
  parentId: number | null

  nameZh: string
  nameEn: string
  slug: string

  descriptionZh: string | null
  descriptionEn: string | null

  icon: string | null

  sortOrder: number
  status: number

  createdAt?: Date
  updatedAt?: Date
}

export async function getCategories(): Promise<CategoryRow[]> {
  const sql = `
    SELECT
      id,
      parent_id AS parentId,

      name_zh AS nameZh,
      name_en AS nameEn,
      slug,

      description_zh AS descriptionZh,
      description_en AS descriptionEn,

      icon,

      sort_order AS sortOrder,
      status,

      created_at AS createdAt,
      updated_at AS updatedAt

    FROM categories

    WHERE status = 1

    ORDER BY
      sort_order ASC,
      id ASC
  `

  const [rows] = await pool.query<CategoryRow[]>(sql)

  return rows
}
