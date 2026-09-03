import type { RowDataPacket } from 'mysql2'
import pool from '../config/database.js'

export interface ProductQuery {
  search?: string
  manufacturer?: string
  category?: string
  page?: number
  pageSize?: number
}

export interface ProductRow extends RowDataPacket {
  id: number

  partNumber: string
  package: string | null

  titleZh: string
  titleEn: string

  descriptionZh: string | null
  descriptionEn: string | null

  status: string

  stockQuantity: number | null
  unit: string

  datasheetUrl: string | null
  imageUrl: string | null

  isFeatured: number
  sortOrder: number

  manufacturerId: number
  manufacturer: string

  categoryId: number
  category: string

  createdAt?: Date
  updatedAt?: Date
}

export interface ProductListResult {
  data: ProductRow[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export async function getProducts(
  query: ProductQuery = {},
): Promise<ProductListResult> {
  const conditions: string[] = []
  const params: (string | number)[] = []

  /*
   * ─────────────────────────────────────────
   * 1. 分页参数
   * ─────────────────────────────────────────
   */

  const page = Math.max(1, Number(query.page) || 1)

  const pageSize = Math.min(
    100,
    Math.max(1, Number(query.pageSize) || 10),
  )

  const offset = (page - 1) * pageSize

  /*
   * ─────────────────────────────────────────
   * 2. 搜索条件
   * ─────────────────────────────────────────
   */

  if (query.search) {
    conditions.push(`
      (
        p.part_number LIKE ?
        OR p.title_zh LIKE ?
        OR p.title_en LIKE ?
        OR p.description_zh LIKE ?
        OR p.description_en LIKE ?
        OR m.name LIKE ?
        OR c.name_zh LIKE ?
        OR c.name_en LIKE ?
      )
    `)

    const keyword = `%${query.search}%`

    params.push(
      keyword,
      keyword,
      keyword,
      keyword,
      keyword,
      keyword,
      keyword,
      keyword,
    )
  }

  /*
   * ─────────────────────────────────────────
   * 3. 厂家筛选
   * ─────────────────────────────────────────
   */

  if (query.manufacturer) {
    conditions.push('m.name = ?')
    params.push(query.manufacturer)
  }

  /*
   * ─────────────────────────────────────────
   * 4. 分类筛选
   * ─────────────────────────────────────────
   */

  if (query.category) {
    conditions.push(`
      (
        c.name_zh = ?
        OR c.name_en = ?
        OR c.slug = ?
      )
    `)

    params.push(
      query.category,
      query.category,
      query.category,
    )
  }

  const whereClause = conditions.length
    ? `WHERE ${conditions.join(' AND ')}`
    : ''

  /*
   * ─────────────────────────────────────────
   * 5. 查询总数量
   * ─────────────────────────────────────────
   */

  const countSql = `
    SELECT COUNT(*) AS total

    FROM products p

    INNER JOIN manufacturers m
      ON p.manufacturer_id = m.id

    INNER JOIN categories c
      ON p.category_id = c.id

    ${whereClause}
  `

  const [countRows] = await pool.query<RowDataPacket[]>(
    countSql,
    params,
  )

  const total = Number(countRows[0]?.total || 0)

  /*
   * ─────────────────────────────────────────
   * 6. 查询当前页产品
   * ─────────────────────────────────────────
   */

  const sql = `
    SELECT
      p.id,
      p.part_number AS partNumber,
      p.package,

      p.title_zh AS titleZh,
      p.title_en AS titleEn,

      p.description_zh AS descriptionZh,
      p.description_en AS descriptionEn,

      p.status,
      p.stock_quantity AS stockQuantity,
      p.unit,

      p.datasheet_url AS datasheetUrl,
      p.image_url AS imageUrl,

      p.is_featured AS isFeatured,
      p.sort_order AS sortOrder,

      m.id AS manufacturerId,
      m.name AS manufacturer,

      c.id AS categoryId,
      c.name_zh AS category

    FROM products p

    INNER JOIN manufacturers m
      ON p.manufacturer_id = m.id

    INNER JOIN categories c
      ON p.category_id = c.id

    ${whereClause}

    ORDER BY
      p.is_featured DESC,
      p.sort_order ASC,
      p.id DESC

    LIMIT ? OFFSET ?
  `

  const dataParams = [
    ...params,
    pageSize,
    offset,
  ]

  const [rows] = await pool.query<ProductRow[]>(
    sql,
    dataParams,
  )

  /*
   * ─────────────────────────────────────────
   * 7. 计算总页数
   * ─────────────────────────────────────────
   */

  const totalPages = Math.ceil(total / pageSize)

  return {
    data: rows,
    total,
    page,
    pageSize,
    totalPages,
  }
}

export async function getProductByPartNumber(
  partNumber: string,
): Promise<ProductRow | null> {
  const sql = `
    SELECT
      p.id,
      p.part_number AS partNumber,
      p.package,

      p.title_zh AS titleZh,
      p.title_en AS titleEn,

      p.description_zh AS descriptionZh,
      p.description_en AS descriptionEn,

      p.status,
      p.stock_quantity AS stockQuantity,
      p.unit,

      p.datasheet_url AS datasheetUrl,
      p.image_url AS imageUrl,

      p.is_featured AS isFeatured,
      p.sort_order AS sortOrder,

      p.created_at AS createdAt,
      p.updated_at AS updatedAt,

      m.id AS manufacturerId,
      m.name AS manufacturer,

      c.id AS categoryId,
      c.name_zh AS category

    FROM products p

    INNER JOIN manufacturers m
      ON p.manufacturer_id = m.id

    INNER JOIN categories c
      ON p.category_id = c.id

    WHERE LOWER(p.part_number) = LOWER(?)

    LIMIT 1
  `

  const [rows] = await pool.query<ProductRow[]>(
    sql,
    [partNumber],
  )

  return rows.length > 0 ? rows[0] : null
}
