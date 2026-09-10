import type {
  ExecuteValues,
  QueryValues,
  ResultSetHeader,
  RowDataPacket,
} from 'mysql2'

import pool from '../../config/database.js'

// ─────────────────────────────────────────────
// Database Row
// ─────────────────────────────────────────────

interface ProductRow extends RowDataPacket {
  id: number

  part_number: string

  manufacturer_id: number | null
  manufacturer_name: string | null

  category_id: number | null
  category_name_zh: string | null
  category_name_en: string | null

  package: string | null

  title_zh: string
  title_en: string

  description_zh: string | null
  description_en: string | null

  status:
    | 'In Stock'
    | 'Available'
    | 'Request Quote'
    | 'Discontinued'

  stock_quantity: number | null

  unit: string

  datasheet_url: string | null

  image_url: string | null

  is_featured: number

  sort_order: number

  created_at: Date

  updated_at: Date
}

// ─────────────────────────────────────────────
// Product Status
// ─────────────────────────────────────────────

export type ProductStatus =
  | 'In Stock'
  | 'Available'
  | 'Request Quote'
  | 'Discontinued'

// ─────────────────────────────────────────────
// Admin Product
// ─────────────────────────────────────────────

export interface AdminProduct {
  id: number

  partNumber: string

  titleZh: string

  titleEn: string

  manufacturer: {
    id: number
    name: string
  } | null

  category: {
    id: number
    nameZh: string
    nameEn: string
  } | null

  package: string | null

  descriptionZh: string | null

  descriptionEn: string | null

  status: ProductStatus

  stockQuantity: number | null

  unit: string

  datasheetUrl: string | null

  imageUrl: string | null

  isFeatured: boolean

  sortOrder: number

  createdAt: Date

  updatedAt: Date
}

// ─────────────────────────────────────────────
// Product List Result
// ─────────────────────────────────────────────

export interface AdminProductListResult {
  products: AdminProduct[]

  pagination: {
    page: number

    pageSize: number

    total: number

    totalPages: number
  }
}

// ─────────────────────────────────────────────
// Query Params
// ─────────────────────────────────────────────

interface GetProductsParams {
  page: number

  pageSize: number

  search?: string

  manufacturerId?: number

  categoryId?: number

  status?: ProductStatus
}

// ─────────────────────────────────────────────
// Create Product Params
// ─────────────────────────────────────────────

export interface CreateProductParams {
  partNumber: string

  manufacturerId: number

  categoryId: number

  package?: string | null

  titleZh: string

  titleEn: string

  descriptionZh?: string | null

  descriptionEn?: string | null

  status?: ProductStatus

  stockQuantity?: number | null

  unit?: string

  datasheetUrl?: string | null

  imageUrl?: string | null

  isFeatured?: boolean

  sortOrder?: number
}

// ─────────────────────────────────────────────
// Update Product Params
// ─────────────────────────────────────────────

export interface UpdateProductParams {
  partNumber?: string

  manufacturerId?: number

  categoryId?: number

  package?: string | null

  titleZh?: string

  titleEn?: string

  descriptionZh?: string | null

  descriptionEn?: string | null

  status?: ProductStatus

  stockQuantity?: number | null

  unit?: string

  datasheetUrl?: string | null

  imageUrl?: string | null

  isFeatured?: boolean

  sortOrder?: number
}

// ─────────────────────────────────────────────
// Helper
// ─────────────────────────────────────────────

function mapProduct(
  row: ProductRow,
): AdminProduct {
  return {
    id: row.id,

    partNumber: row.part_number,

    titleZh: row.title_zh,

    titleEn: row.title_en,

    manufacturer:
      row.manufacturer_id !== null
        ? {
            id: row.manufacturer_id,

            name:
              row.manufacturer_name ?? '',
          }
        : null,

    category:
      row.category_id !== null
        ? {
            id: row.category_id,

            nameZh:
              row.category_name_zh ?? '',

            nameEn:
              row.category_name_en ?? '',
          }
        : null,

    package: row.package,

    descriptionZh:
      row.description_zh,

    descriptionEn:
      row.description_en,

    status: row.status,

    stockQuantity:
      row.stock_quantity,

    unit: row.unit,

    datasheetUrl:
      row.datasheet_url,

    imageUrl:
      row.image_url,

    isFeatured:
      Boolean(row.is_featured),

    sortOrder:
      row.sort_order,

    createdAt:
      row.created_at,

    updatedAt:
      row.updated_at,
  }
}

// ─────────────────────────────────────────────
// Get Product List
// ─────────────────────────────────────────────

export async function getAdminProducts(
  params: GetProductsParams,
): Promise<AdminProductListResult> {
  const {
    page,
    pageSize,
    search,
    manufacturerId,
    categoryId,
    status,
  } = params

  const offset =
    (page - 1) * pageSize

  const conditions: string[] = []

  const values: QueryValues[] = []

  // Search

  if (search) {
    conditions.push(`
      (
        p.part_number LIKE ?
        OR p.title_zh LIKE ?
        OR p.title_en LIKE ?
      )
    `)

    const keyword =
      `%${search}%`

    values.push(
      keyword,
      keyword,
      keyword,
    )
  }

  // Manufacturer

  if (manufacturerId) {
    conditions.push(
      'p.manufacturer_id = ?',
    )

    values.push(manufacturerId)
  }

  // Category

  if (categoryId) {
    conditions.push(
      'p.category_id = ?',
    )

    values.push(categoryId)
  }

  // Status

  if (status) {
    conditions.push(
      'p.status = ?',
    )

    values.push(status)
  }

  const whereClause =
    conditions.length > 0
      ? `WHERE ${conditions.join(' AND ')}`
      : ''

  // Count

  const [countRows] =
    await pool.query<RowDataPacket[]>(
      `
        SELECT
          COUNT(*) AS total
        FROM products p
        ${whereClause}
      `,
      values,
    )

  const total = Number(
    countRows[0]?.total ?? 0,
  )

  // Product List

  const [rows] =
    await pool.query<ProductRow[]>(
      `
        SELECT
          p.id,

          p.part_number,

          p.manufacturer_id,

          m.name AS manufacturer_name,

          p.category_id,

          c.name_zh AS category_name_zh,

          c.name_en AS category_name_en,

          p.package,

          p.title_zh,

          p.title_en,

          p.description_zh,

          p.description_en,

          p.status,

          p.stock_quantity,

          p.unit,

          p.datasheet_url,

          p.image_url,

          p.is_featured,

          p.sort_order,

          p.created_at,

          p.updated_at

        FROM products p

        LEFT JOIN manufacturers m
          ON p.manufacturer_id = m.id

        LEFT JOIN categories c
          ON p.category_id = c.id

        ${whereClause}

        ORDER BY
          p.sort_order ASC,
          p.id DESC

        LIMIT ? OFFSET ?
      `,
      [
        ...values,

        pageSize,

        offset,
      ],
    )

  const products =
    rows.map(mapProduct)

  return {
    products,

    pagination: {
      page,

      pageSize,

      total,

      totalPages:
        Math.ceil(total / pageSize),
    },
  }
}

// ─────────────────────────────────────────────
// Get Product By ID
// ─────────────────────────────────────────────

export async function getAdminProductById(
  id: number,
): Promise<AdminProduct | null> {
  const [rows] =
    await pool.query<ProductRow[]>(
      `
        SELECT
          p.id,

          p.part_number,

          p.manufacturer_id,

          m.name AS manufacturer_name,

          p.category_id,

          c.name_zh AS category_name_zh,

          c.name_en AS category_name_en,

          p.package,

          p.title_zh,

          p.title_en,

          p.description_zh,

          p.description_en,

          p.status,

          p.stock_quantity,

          p.unit,

          p.datasheet_url,

          p.image_url,

          p.is_featured,

          p.sort_order,

          p.created_at,

          p.updated_at

        FROM products p

        LEFT JOIN manufacturers m
          ON p.manufacturer_id = m.id

        LEFT JOIN categories c
          ON p.category_id = c.id

        WHERE p.id = ?

        LIMIT 1
      `,
      [id],
    )

  if (rows.length === 0) {
    return null
  }

  return mapProduct(rows[0])
}

// ─────────────────────────────────────────────
// Create Product
// ─────────────────────────────────────────────

export async function createAdminProduct(
  params: CreateProductParams,
): Promise<AdminProduct> {
  const [
    result,
  ] =
    await pool.execute<ResultSetHeader>(
      `
        INSERT INTO products (
          part_number,

          manufacturer_id,

          category_id,

          package,

          title_zh,

          title_en,

          description_zh,

          description_en,

          status,

          stock_quantity,

          unit,

          datasheet_url,

          image_url,

          is_featured,

          sort_order
        )
        VALUES (
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?,
          ?, ?, ?, ?
        )
      `,
      [
        params.partNumber,

        params.manufacturerId,

        params.categoryId,

        params.package ?? null,

        params.titleZh,

        params.titleEn,

        params.descriptionZh ?? null,

        params.descriptionEn ?? null,

        params.status ?? 'Available',

        params.stockQuantity ?? null,

        params.unit ?? 'pcs',

        params.datasheetUrl ?? null,

        params.imageUrl ?? null,

        params.isFeatured ? 1 : 0,

        params.sortOrder ?? 0,
      ],
    )

  const product =
    await getAdminProductById(
      result.insertId,
    )

  if (!product) {
    throw new Error(
      'Failed to retrieve created product',
    )
  }

  return product
}

// ─────────────────────────────────────────────
// Update Product
// ─────────────────────────────────────────────

export async function updateAdminProduct(
  id: number,
  params: UpdateProductParams,
): Promise<AdminProduct | null> {
  const fields: string[] = []

  const values: ExecuteValues = []

  if (
    params.partNumber !== undefined
  ) {
    fields.push(
      'part_number = ?',
    )

    values.push(
      params.partNumber,
    )
  }

  if (
    params.manufacturerId !== undefined
  ) {
    fields.push(
      'manufacturer_id = ?',
    )

    values.push(
      params.manufacturerId,
    )
  }

  if (
    params.categoryId !== undefined
  ) {
    fields.push(
      'category_id = ?',
    )

    values.push(
      params.categoryId,
    )
  }

  if (
    params.package !== undefined
  ) {
    fields.push(
      'package = ?',
    )

    values.push(
      params.package,
    )
  }

  if (
    params.titleZh !== undefined
  ) {
    fields.push(
      'title_zh = ?',
    )

    values.push(
      params.titleZh,
    )
  }

  if (
    params.titleEn !== undefined
  ) {
    fields.push(
      'title_en = ?',
    )

    values.push(
      params.titleEn,
    )
  }

  if (
    params.descriptionZh !== undefined
  ) {
    fields.push(
      'description_zh = ?',
    )

    values.push(
      params.descriptionZh,
    )
  }

  if (
    params.descriptionEn !== undefined
  ) {
    fields.push(
      'description_en = ?',
    )

    values.push(
      params.descriptionEn,
    )
  }

  if (
    params.status !== undefined
  ) {
    fields.push(
      'status = ?',
    )

    values.push(
      params.status,
    )
  }

  if (
    params.stockQuantity !== undefined
  ) {
    fields.push(
      'stock_quantity = ?',
    )

    values.push(
      params.stockQuantity,
    )
  }

  if (
    params.unit !== undefined
  ) {
    fields.push(
      'unit = ?',
    )

    values.push(
      params.unit,
    )
  }

  if (
    params.datasheetUrl !== undefined
  ) {
    fields.push(
      'datasheet_url = ?',
    )

    values.push(
      params.datasheetUrl,
    )
  }

  if (
    params.imageUrl !== undefined
  ) {
    fields.push(
      'image_url = ?',
    )

    values.push(
      params.imageUrl,
    )
  }

  if (
    params.isFeatured !== undefined
  ) {
    fields.push(
      'is_featured = ?',
    )

    values.push(
      params.isFeatured
        ? 1
        : 0,
    )
  }

  if (
    params.sortOrder !== undefined
  ) {
    fields.push(
      'sort_order = ?',
    )

    values.push(
      params.sortOrder,
    )
  }

  // Nothing to update

  if (fields.length === 0) {
    return getAdminProductById(id)
  }

  values.push(id)

  const [
    result,
  ] =
    await pool.execute<ResultSetHeader>(
      `
        UPDATE products
        SET
          ${fields.join(', ')}
        WHERE id = ?
      `,
      values,
    )

  if (
    result.affectedRows === 0
  ) {
    return null
  }

  return getAdminProductById(id)
}

// ─────────────────────────────────────────────
// Delete Product
// ─────────────────────────────────────────────

export async function deleteAdminProduct(
  id: number,
): Promise<boolean> {
  const [
    result,
  ] =
    await pool.execute<ResultSetHeader>(
      `
        DELETE FROM products
        WHERE id = ?
      `,
      [id],
    )

  return (
    result.affectedRows > 0
  )
}
// ─────────────────────────────────────────────
// Delete Products In Batch
// ─────────────────────────────────────────────

export async function deleteAdminProducts(
  ids: number[],
): Promise<number> {
  if (ids.length === 0) {
    return 0
  }

  const placeholders =
    ids.map(() => '?').join(', ')

  const [
    result,
  ] =
    await pool.execute<ResultSetHeader>(
      `
        DELETE FROM products
        WHERE id IN (${placeholders})
      `,
      ids,
    )

  return result.affectedRows
}
