import type {
  ResultSetHeader,
  RowDataPacket,
} from 'mysql2'

import pool from '../../config/database.js'

// ─────────────────────────────────────────────
// Quote Status
// ─────────────────────────────────────────────

export type QuoteRequestStatus =
  | 'New'
  | 'Processing'
  | 'Quoted'
  | 'Completed'
  | 'Cancelled'

// ─────────────────────────────────────────────
// Database Rows
// ─────────────────────────────────────────────

interface QuoteRequestRow
  extends RowDataPacket {
  id: number
  quote_no: string
  company: string | null
  contact_name: string
  business_email: string
  phone: string | null
  requirements: string | null
  status: QuoteRequestStatus
  admin_note: string | null
  created_at: Date
  updated_at: Date
}

interface QuoteRequestItemRow
  extends RowDataPacket {
  id: number
  quote_request_id: number
  product_id: number | null
  part_number: string
  manufacturer: string | null
  quantity: number | null
  unit: string
  target_price: number | null
  delivery_date: Date | null
  technical_requirements: string | null
  created_at: Date

  product_title_zh: string | null
  product_title_en: string | null
}

// ─────────────────────────────────────────────
// Admin Quote Request
// ─────────────────────────────────────────────

export interface AdminQuoteRequest {
  id: number
  quoteNo: string
  company: string | null
  contactName: string
  businessEmail: string
  phone: string | null
  requirements: string | null
  status: QuoteRequestStatus
  adminNote: string | null
  itemCount: number
  createdAt: Date
  updatedAt: Date
}

// ─────────────────────────────────────────────
// Quote Request Detail
// ─────────────────────────────────────────────

export interface AdminQuoteRequestItem {
  id: number
  productId: number | null
  partNumber: string
  manufacturer: string | null
  quantity: number | null
  unit: string
  targetPrice: number | null
  deliveryDate: Date | null
  technicalRequirements: string | null
  productTitleZh: string | null
  productTitleEn: string | null
  createdAt: Date
}

export interface AdminQuoteRequestDetail
  extends AdminQuoteRequest {
  items: AdminQuoteRequestItem[]
}

// ─────────────────────────────────────────────
// List Result
// ─────────────────────────────────────────────

export interface AdminQuoteRequestListResult {
  items: AdminQuoteRequest[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// ─────────────────────────────────────────────
// Query Params
// ─────────────────────────────────────────────

export interface GetQuoteRequestsParams {
  page: number
  pageSize: number
  keyword?: string
  status?: QuoteRequestStatus
}

// ─────────────────────────────────────────────
// Update Params
// ─────────────────────────────────────────────

export interface UpdateQuoteRequestParams {
  status?: QuoteRequestStatus
  adminNote?: string | null
}

// ─────────────────────────────────────────────
// Helper
// ─────────────────────────────────────────────

function mapQuoteRequest(
  row: QuoteRequestRow,
): AdminQuoteRequest {
  return {
    id: row.id,
    quoteNo: row.quote_no,
    company: row.company,
    contactName: row.contact_name,
    businessEmail: row.business_email,
    phone: row.phone,
    requirements: row.requirements,
    status: row.status,
    adminNote: row.admin_note,
    itemCount: Number(
      (row as QuoteRequestRow & {
        item_count?: number
      }).item_count ?? 0,
    ),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function mapQuoteRequestItem(
  row: QuoteRequestItemRow,
): AdminQuoteRequestItem {
  return {
    id: row.id,
    productId: row.product_id,
    partNumber: row.part_number,
    manufacturer: row.manufacturer,
    quantity:
      row.quantity !== null
        ? Number(row.quantity)
        : null,
    unit: row.unit,
    targetPrice:
      row.target_price !== null
        ? Number(row.target_price)
        : null,
    deliveryDate: row.delivery_date,
    technicalRequirements:
      row.technical_requirements,
    productTitleZh:
      row.product_title_zh,
    productTitleEn:
      row.product_title_en,
    createdAt: row.created_at,
  }
}

// ─────────────────────────────────────────────
// Get Quote Request List
// ─────────────────────────────────────────────

export async function getAdminQuoteRequests(
  params: GetQuoteRequestsParams,
): Promise<AdminQuoteRequestListResult> {
  const {
    page,
    pageSize,
    keyword,
    status,
  } = params

  const offset =
    (page - 1) * pageSize

  const conditions: string[] = []
  const values: (string | number | null)[] = []

  // ─────────────────────────────────────────
  // Keyword Search
  // ─────────────────────────────────────────
  //
  // Search:
  // 1. Quote No
  // 2. Company
  // 3. Contact Name
  // 4. Business Email
  // 5. Phone
  // 6. Product Part Number
  // 7. Manufacturer
  //
  // EXISTS is used for quote_request_items
  // to avoid duplicate quote requests when
  // one request contains multiple items.
  // ─────────────────────────────────────────

  if (keyword) {
    conditions.push(`
      (
        qr.quote_no LIKE ?
        OR qr.company LIKE ?
        OR qr.contact_name LIKE ?
        OR qr.business_email LIKE ?
        OR qr.phone LIKE ?

        OR EXISTS (
          SELECT 1
          FROM quote_request_items qri_search
          WHERE
            qri_search.quote_request_id = qr.id
            AND (
              qri_search.part_number LIKE ?
              OR qri_search.manufacturer LIKE ?
            )
        )
      )
    `)

    const searchKeyword =
      `%${keyword}%`

    values.push(
      searchKeyword,
      searchKeyword,
      searchKeyword,
      searchKeyword,
      searchKeyword,
      searchKeyword,
      searchKeyword,
    )
  }

  // ─────────────────────────────────────────
  // Status
  // ─────────────────────────────────────────

  if (status) {
    conditions.push(
      'qr.status = ?',
    )

    values.push(status)
  }

  const whereClause =
    conditions.length > 0
      ? `WHERE ${conditions.join(' AND ')}`
      : ''

  // ─────────────────────────────────────────
  // Count
  // ─────────────────────────────────────────

  const [countRows] =
    await pool.query<RowDataPacket[]>(
      `
        SELECT
          COUNT(*) AS total

        FROM quote_requests qr

        ${whereClause}
      `,
      values,
    )

  const total = Number(
    countRows[0]?.total ?? 0,
  )

  // ─────────────────────────────────────────
  // List
  // ─────────────────────────────────────────

  const [rows] =
    await pool.query<QuoteRequestRow[]>(
      `
        SELECT
          qr.id,
          qr.quote_no,
          qr.company,
          qr.contact_name,
          qr.business_email,
          qr.phone,
          qr.requirements,
          qr.status,
          qr.admin_note,
          qr.created_at,
          qr.updated_at,

          COUNT(qri.id) AS item_count

        FROM quote_requests qr

        LEFT JOIN quote_request_items qri
          ON qri.quote_request_id = qr.id

        ${whereClause}

        GROUP BY
          qr.id,
          qr.quote_no,
          qr.company,
          qr.contact_name,
          qr.business_email,
          qr.phone,
          qr.requirements,
          qr.status,
          qr.admin_note,
          qr.created_at,
          qr.updated_at

        ORDER BY
          qr.created_at DESC,
          qr.id DESC

        LIMIT ? OFFSET ?
      `,
      [
        ...values,
        pageSize,
        offset,
      ],
    )

  const items =
    rows.map(mapQuoteRequest)

  return {
    items,
    total,
    page,
    pageSize,
    totalPages:
      Math.ceil(total / pageSize),
  }
}

// ─────────────────────────────────────────────
// Get Quote Request By ID
// ─────────────────────────────────────────────

export async function getAdminQuoteRequestById(
  id: number,
): Promise<AdminQuoteRequestDetail | null> {
  // ─────────────────────────────────────────
  // Main Request
  // ─────────────────────────────────────────

  const [requestRows] =
    await pool.query<QuoteRequestRow[]>(
      `
        SELECT
          qr.id,
          qr.quote_no,
          qr.company,
          qr.contact_name,
          qr.business_email,
          qr.phone,
          qr.requirements,
          qr.status,
          qr.admin_note,
          qr.created_at,
          qr.updated_at,

          (
            SELECT COUNT(*)
            FROM quote_request_items qri_count
            WHERE qri_count.quote_request_id = qr.id
          ) AS item_count

        FROM quote_requests qr

        WHERE qr.id = ?

        LIMIT 1
      `,
      [id],
    )

  if (requestRows.length === 0) {
    return null
  }

  const request =
    mapQuoteRequest(requestRows[0])

  // ─────────────────────────────────────────
  // Request Items
  // ─────────────────────────────────────────

  const [itemRows] =
    await pool.query<QuoteRequestItemRow[]>(
      `
        SELECT
          qri.id,
          qri.quote_request_id,
          qri.product_id,
          qri.part_number,
          qri.manufacturer,
          qri.quantity,
          qri.unit,
          qri.target_price,
          qri.delivery_date,
          qri.technical_requirements,
          qri.created_at,

          p.title_zh AS product_title_zh,
          p.title_en AS product_title_en

        FROM quote_request_items qri

        LEFT JOIN products p
          ON p.id = qri.product_id

        WHERE qri.quote_request_id = ?

        ORDER BY
          qri.id ASC
      `,
      [id],
    )

  return {
    ...request,
    items:
      itemRows.map(mapQuoteRequestItem),
  }
}

// ─────────────────────────────────────────────
// Update Quote Request
// ─────────────────────────────────────────────

export async function updateAdminQuoteRequest(
  id: number,
  params: UpdateQuoteRequestParams,
): Promise<AdminQuoteRequestDetail | null> {
  const fields: string[] = []
  const values: (string | number | null)[] = []

  if (params.status !== undefined) {
    fields.push(
      'status = ?',
    )

    values.push(
      params.status,
    )
  }

  if (params.adminNote !== undefined) {
    fields.push(
      'admin_note = ?',
    )

    values.push(
      params.adminNote,
    )
  }

  // Nothing to update
  if (fields.length === 0) {
    return getAdminQuoteRequestById(id)
  }

  values.push(id)

  const [
    result,
  ] =
    await pool.execute<ResultSetHeader>(
      `
        UPDATE quote_requests

        SET
          ${fields.join(', ')}

        WHERE id = ?
      `,
      values,
    )

  if (result.affectedRows === 0) {
    return null
  }

  return getAdminQuoteRequestById(id)
}

// ─────────────────────────────────────────────
// Delete Quote Request
// ─────────────────────────────────────────────

export async function deleteAdminQuoteRequest(
  id: number,
): Promise<boolean> {
  const [
    result,
  ] =
    await pool.execute<ResultSetHeader>(
      `
        DELETE FROM quote_requests

        WHERE id = ?
      `,
      [id],
    )

  return result.affectedRows > 0
}

