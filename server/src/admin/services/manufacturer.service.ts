import type {
  ResultSetHeader,
  RowDataPacket,
} from 'mysql2'

import pool from '../../config/database.js'

export interface ManufacturerRow
  extends RowDataPacket {
  id: number
  name: string
  code: string | null
  logo_url: string | null
  website: string | null
  description: string | null
  status: number
  sort_order: number
  created_at: Date
  updated_at: Date
}

export interface AdminManufacturer {
  id: number
  name: string
  code: string | null
  logoUrl: string | null
  website: string | null
  description: string | null
  status: number
  sortOrder: number
  createdAt: Date
  updatedAt: Date
}

export interface AdminManufacturerListResult {
  items: AdminManufacturer[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface GetManufacturersParams {
  page?: number
  pageSize?: number
  keyword?: string
  status?: number
}

export interface CreateManufacturerParams {
  name: string
  code?: string | null
  logoUrl?: string | null
  website?: string | null
  description?: string | null
  status?: number
  sortOrder?: number
}

export interface UpdateManufacturerParams {
  name?: string
  code?: string | null
  logoUrl?: string | null
  website?: string | null
  description?: string | null
  status?: number
  sortOrder?: number
}

function mapManufacturer(
  row: ManufacturerRow,
): AdminManufacturer {
  return {
    id: row.id,
    name: row.name,
    code: row.code,
    logoUrl: row.logo_url,
    website: row.website,
    description: row.description,
    status: row.status,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function getAdminManufacturers(
  params: GetManufacturersParams = {},
): Promise<AdminManufacturerListResult> {
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

  const whereConditions: string[] = []
  const whereParams: (string | number)[] = []

  if (keyword) {
    whereConditions.push(
      `
        (
          name LIKE ?
          OR code LIKE ?
        )
      `,
    )

    const searchKeyword =
      `%${keyword}%`

    whereParams.push(
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

  const whereClause =
    whereConditions.length > 0
      ? `WHERE ${whereConditions.join(' AND ')}`
      : ''

  const [
    countRows,
  ] = await pool.execute<RowDataPacket[]>(
    `
      SELECT COUNT(*) AS total
      FROM manufacturers
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
    await pool.execute<ManufacturerRow[]>(
      `
        SELECT
          id,
          name,
          code,
          logo_url,
          website,
          description,
          status,
          sort_order,
          created_at,
          updated_at
        FROM manufacturers
        ${whereClause}
        ORDER BY
          sort_order ASC,
          id DESC
        LIMIT ? OFFSET ?
      `,
      [
        ...whereParams,
        pageSize,
        safeOffset,
      ],
    )

  return {
    items: rows.map(mapManufacturer),
    total,
    page: safePage,
    pageSize,
    totalPages,
  }
}

export async function getAdminManufacturerById(
  id: number,
): Promise<AdminManufacturer | null> {
  const [
    rows,
  ] =
    await pool.execute<ManufacturerRow[]>(
      `
        SELECT
          id,
          name,
          code,
          logo_url,
          website,
          description,
          status,
          sort_order,
          created_at,
          updated_at
        FROM manufacturers
        WHERE id = ?
        LIMIT 1
      `,
      [id],
    )

  const row = rows[0]

  if (!row) {
    return null
  }

  return mapManufacturer(row)
}

export async function createAdminManufacturer(
  params: CreateManufacturerParams,
): Promise<AdminManufacturer> {
  const name =
    params.name.trim()

  if (!name) {
    throw new Error(
      'Manufacturer name is required',
    )
  }

  const code =
    params.code?.trim() || null

  const logoUrl =
    params.logoUrl?.trim() || null

  const website =
    params.website?.trim() || null

  const description =
    params.description?.trim() || null

  const status =
    params.status === 0
      ? 0
      : 1

  const sortOrder =
    Number.isInteger(
      params.sortOrder,
    )
      ? Number(params.sortOrder)
      : 0

  const [
    result,
  ] =
    await pool.execute<ResultSetHeader>(
      `
        INSERT INTO manufacturers (
          name,
          code,
          logo_url,
          website,
          description,
          status,
          sort_order
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [
        name,
        code,
        logoUrl,
        website,
        description,
        status,
        sortOrder,
      ],
    )

  const manufacturer =
    await getAdminManufacturerById(
      result.insertId,
    )

  if (!manufacturer) {
    throw new Error(
      'Failed to retrieve created manufacturer',
    )
  }

  return manufacturer
}

export async function updateAdminManufacturer(
  id: number,
  params: UpdateManufacturerParams,
): Promise<AdminManufacturer | null> {
  const existing =
    await getAdminManufacturerById(id)

  if (!existing) {
    return null
  }

  const name =
    params.name !== undefined
      ? params.name.trim()
      : existing.name

  if (!name) {
    throw new Error(
      'Manufacturer name is required',
    )
  }

  const code =
    params.code !== undefined
      ? params.code?.trim() || null
      : existing.code

  const logoUrl =
    params.logoUrl !== undefined
      ? params.logoUrl?.trim() || null
      : existing.logoUrl

  const website =
    params.website !== undefined
      ? params.website?.trim() || null
      : existing.website

  const description =
    params.description !== undefined
      ? params.description?.trim() || null
      : existing.description

  const status =
    params.status !== undefined
      ? params.status === 0
        ? 0
        : 1
      : existing.status

  const sortOrder =
    params.sortOrder !== undefined
      ? Number.isInteger(
          params.sortOrder,
        )
        ? Number(params.sortOrder)
        : existing.sortOrder
      : existing.sortOrder

  await pool.execute<ResultSetHeader>(
    `
      UPDATE manufacturers
      SET
        name = ?,
        code = ?,
        logo_url = ?,
        website = ?,
        description = ?,
        status = ?,
        sort_order = ?
      WHERE id = ?
    `,
    [
      name,
      code,
      logoUrl,
      website,
      description,
      status,
      sortOrder,
      id,
    ],
  )

  return getAdminManufacturerById(id)
}

export async function deleteAdminManufacturer(
  id: number,
): Promise<boolean> {
  const [
    result,
  ] =
    await pool.execute<ResultSetHeader>(
      `
        DELETE FROM manufacturers
        WHERE id = ?
      `,
      [id],
    )

  return result.affectedRows > 0
}

