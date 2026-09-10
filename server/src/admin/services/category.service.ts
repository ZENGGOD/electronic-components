import type {
  ResultSetHeader,
  RowDataPacket,
} from 'mysql2'

import pool from '../../config/database.js'

export interface CategoryRow
  extends RowDataPacket {
  id: number
  parent_id: number | null
  name_zh: string
  name_en: string
  slug: string
  description_zh: string | null
  description_en: string | null
  icon: string | null
  sort_order: number
  status: number
  created_at: Date
  updated_at: Date
}

export interface AdminCategory {
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
  createdAt: Date
  updatedAt: Date
}

export interface AdminCategoryListResult {
  items: AdminCategory[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface GetCategoriesParams {
  page?: number
  pageSize?: number
  keyword?: string
  status?: number
  parentId?: number | null
}

export interface CreateCategoryParams {
  parentId?: number | null
  nameZh: string
  nameEn: string
  slug: string
  descriptionZh?: string | null
  descriptionEn?: string | null
  icon?: string | null
  sortOrder?: number
  status?: number
}

export interface UpdateCategoryParams {
  parentId?: number | null
  nameZh?: string
  nameEn?: string
  slug?: string
  descriptionZh?: string | null
  descriptionEn?: string | null
  icon?: string | null
  sortOrder?: number
  status?: number
}

function mapCategory(
  row: CategoryRow,
): AdminCategory {
  return {
    id: row.id,
    parentId: row.parent_id,
    nameZh: row.name_zh,
    nameEn: row.name_en,
    slug: row.slug,
    descriptionZh: row.description_zh,
    descriptionEn: row.description_en,
    icon: row.icon,
    sortOrder: row.sort_order,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function getAdminCategories(
  params: GetCategoriesParams = {},
): Promise<AdminCategoryListResult> {
  const page = Math.max(
    Number(params.page) || 1,
    1,
  )

  const pageSize = Math.min(
    Math.max(
      Number(params.pageSize) || 20,
      1,
    ),
    100,
  )

  const keyword =
    params.keyword?.trim() || ''

  const status =
    params.status === 0 ||
    params.status === 1
      ? params.status
      : undefined

  const parentId =
    params.parentId !== undefined
      ? params.parentId
      : undefined

  const whereConditions: string[] = []
  const whereParams: (string | number | null)[] = []

  if (keyword) {
    whereConditions.push(
      `
        (
          name_zh LIKE ?
          OR name_en LIKE ?
          OR slug LIKE ?
        )
      `,
    )

    const searchKeyword =
      `%${keyword}%`

    whereParams.push(
      searchKeyword,
      searchKeyword,
      searchKeyword,
    )
  }

  if (status !== undefined) {
    whereConditions.push(
      'status = ?',
    )

    whereParams.push(status)
  }

  if (parentId !== undefined) {
    if (parentId === null) {
      whereConditions.push(
        'parent_id IS NULL',
      )
    } else {
      whereConditions.push(
        'parent_id = ?',
      )

      whereParams.push(parentId)
    }
  }

  const whereClause =
    whereConditions.length > 0
      ? `WHERE ${whereConditions.join(' AND ')}`
      : ''

  const [
    countRows,
  ] = await pool.execute<RowDataPacket[]>(
    `
      SELECT COUNT(*) AS total
      FROM categories
      ${whereClause}
    `,
    whereParams,
  )

  const total =
    Number(countRows[0]?.total) || 0

  const totalPages =
    Math.max(
      Math.ceil(
        total / pageSize,
      ),
      1,
    )

  const safePage =
    Math.min(page, totalPages)

  const safeOffset =
    (safePage - 1) * pageSize

  const [
    rows,
  ] =
    await pool.execute<CategoryRow[]>(
      `
        SELECT
          id,
          parent_id,
          name_zh,
          name_en,
          slug,
          description_zh,
          description_en,
          icon,
          sort_order,
          status,
          created_at,
          updated_at
        FROM categories
        ${whereClause}
        ORDER BY
          sort_order ASC,
          id ASC
        LIMIT ? OFFSET ?
      `,
      [
        ...whereParams,
        pageSize,
        safeOffset,
      ],
    )

  return {
    items: rows.map(mapCategory),
    total,
    page: safePage,
    pageSize,
    totalPages,
  }
}

export async function getAdminCategoryById(
  id: number,
): Promise<AdminCategory | null> {
  const [
    rows,
  ] =
    await pool.execute<CategoryRow[]>(
      `
        SELECT
          id,
          parent_id,
          name_zh,
          name_en,
          slug,
          description_zh,
          description_en,
          icon,
          sort_order,
          status,
          created_at,
          updated_at
        FROM categories
        WHERE id = ?
        LIMIT 1
      `,
      [id],
    )

  const row = rows[0]

  if (!row) {
    return null
  }

  return mapCategory(row)
}

export async function createAdminCategory(
  params: CreateCategoryParams,
): Promise<AdminCategory> {
  const nameZh =
    params.nameZh.trim()

  const nameEn =
    params.nameEn.trim()

  const slug =
    params.slug.trim()

  if (!nameZh) {
    throw new Error(
      'Chinese category name is required',
    )
  }

  if (!nameEn) {
    throw new Error(
      'English category name is required',
    )
  }

  if (!slug) {
    throw new Error(
      'Category slug is required',
    )
  }

  const parentId =
    params.parentId === undefined
      ? null
      : params.parentId

  const descriptionZh =
    params.descriptionZh?.trim() || null

  const descriptionEn =
    params.descriptionEn?.trim() || null

  const icon =
    params.icon?.trim() || null

  const sortOrder =
    Number.isInteger(
      params.sortOrder,
    )
      ? Number(params.sortOrder)
      : 0

  const status =
    params.status === 0
      ? 0
      : 1

  if (parentId !== null) {
    const parent =
      await getAdminCategoryById(
        parentId,
      )

    if (!parent) {
      throw new Error(
        'Parent category does not exist',
      )
    }
  }

  const [
    result,
  ] =
    await pool.execute<ResultSetHeader>(
      `
        INSERT INTO categories (
          parent_id,
          name_zh,
          name_en,
          slug,
          description_zh,
          description_en,
          icon,
          sort_order,
          status
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        parentId,
        nameZh,
        nameEn,
        slug,
        descriptionZh,
        descriptionEn,
        icon,
        sortOrder,
        status,
      ],
    )

  const category =
    await getAdminCategoryById(
      result.insertId,
    )

  if (!category) {
    throw new Error(
      'Failed to retrieve created category',
    )
  }

  return category
}

export async function updateAdminCategory(
  id: number,
  params: UpdateCategoryParams,
): Promise<AdminCategory | null> {
  const existing =
    await getAdminCategoryById(id)

  if (!existing) {
    return null
  }

  const parentId =
    params.parentId !== undefined
      ? params.parentId
      : existing.parentId

  if (parentId === id) {
    throw new Error(
      'Category cannot be its own parent',
    )
  }

  if (parentId !== null) {
    const parent =
      await getAdminCategoryById(
        parentId,
      )

    if (!parent) {
      throw new Error(
        'Parent category does not exist',
      )
    }
  }

  const nameZh =
    params.nameZh !== undefined
      ? params.nameZh.trim()
      : existing.nameZh

  const nameEn =
    params.nameEn !== undefined
      ? params.nameEn.trim()
      : existing.nameEn

  const slug =
    params.slug !== undefined
      ? params.slug.trim()
      : existing.slug

  if (!nameZh) {
    throw new Error(
      'Chinese category name is required',
    )
  }

  if (!nameEn) {
    throw new Error(
      'English category name is required',
    )
  }

  if (!slug) {
    throw new Error(
      'Category slug is required',
    )
  }

  const descriptionZh =
    params.descriptionZh !== undefined
      ? params.descriptionZh?.trim() || null
      : existing.descriptionZh

  const descriptionEn =
    params.descriptionEn !== undefined
      ? params.descriptionEn?.trim() || null
      : existing.descriptionEn

  const icon =
    params.icon !== undefined
      ? params.icon?.trim() || null
      : existing.icon

  const sortOrder =
    params.sortOrder !== undefined
      ? Number.isInteger(
          params.sortOrder,
        )
        ? Number(params.sortOrder)
        : existing.sortOrder
      : existing.sortOrder

  const status =
    params.status !== undefined
      ? params.status === 0
        ? 0
        : 1
      : existing.status

  await pool.execute<ResultSetHeader>(
    `
      UPDATE categories
      SET
        parent_id = ?,
        name_zh = ?,
        name_en = ?,
        slug = ?,
        description_zh = ?,
        description_en = ?,
        icon = ?,
        sort_order = ?,
        status = ?
      WHERE id = ?
    `,
    [
      parentId,
      nameZh,
      nameEn,
      slug,
      descriptionZh,
      descriptionEn,
      icon,
      sortOrder,
      status,
      id,
    ],
  )

  return getAdminCategoryById(id)
}

export async function deleteAdminCategory(
  id: number,
): Promise<boolean> {
  const [
    children,
  ] =
    await pool.execute<RowDataPacket[]>(
      `
        SELECT id
        FROM categories
        WHERE parent_id = ?
        LIMIT 1
      `,
      [id],
    )

  if (children.length > 0) {
    throw new Error(
      'Cannot delete category with child categories',
    )
  }

  const [
    products,
  ] =
    await pool.execute<RowDataPacket[]>(
      `
        SELECT id
        FROM products
        WHERE category_id = ?
        LIMIT 1
      `,
      [id],
    )

  if (products.length > 0) {
    throw new Error(
      'Cannot delete category with products',
    )
  }

  const [
    result,
  ] =
    await pool.execute<ResultSetHeader>(
      `
        DELETE FROM categories
        WHERE id = ?
      `,
      [id],
    )

  return result.affectedRows > 0
}
