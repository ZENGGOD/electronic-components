import type {
  ResultSetHeader,
  RowDataPacket,
} from 'mysql2'

import pool from '../../config/database.js'

export type ContactMessageStatus =
  | 'New'
  | 'Processing'
  | 'Replied'
  | 'Closed'

export interface ContactMessageRow
  extends RowDataPacket {
  id: number
  name: string
  company: string | null
  business_email: string
  phone_whatsapp: string | null
  subject: string | null
  message: string
  status: ContactMessageStatus
  admin_note: string | null
  created_at: Date
  updated_at: Date
}

export interface AdminContactMessage {
  id: number
  name: string
  company: string | null
  businessEmail: string
  phoneWhatsapp: string | null
  subject: string | null
  message: string
  status: ContactMessageStatus
  adminNote: string | null
  createdAt: Date
  updatedAt: Date
}

export interface AdminContactMessageListResult {
  items: AdminContactMessage[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface GetContactMessagesParams {
  page: number
  pageSize: number
  keyword?: string
  status?: ContactMessageStatus
}

export interface UpdateContactMessageParams {
  status?: ContactMessageStatus
  adminNote?: string | null
}

function mapContactMessage(
  row: ContactMessageRow,
): AdminContactMessage {
  return {
    id: row.id,
    name: row.name,
    company: row.company,
    businessEmail:
      row.business_email,
    phoneWhatsapp:
      row.phone_whatsapp,
    subject: row.subject,
    message: row.message,
    status: row.status,
    adminNote: row.admin_note,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

/**
 * 获取后台客户留言列表
 */
export async function getAdminContactMessages(
  params: GetContactMessagesParams,
): Promise<AdminContactMessageListResult> {
  const {
    page,
    pageSize,
    keyword,
    status,
  } = params

  const whereConditions: string[] = []
  const values: (
    string | number | null
  )[] = []

  /**
   * 关键词搜索
   *
   * 搜索：
   * - 姓名
   * - 公司
   * - 商务邮箱
   * - 电话 / WhatsApp
   * - 主题
   * - 留言内容
   */
  if (keyword) {
    const searchValue =
      `%${keyword}%`

    whereConditions.push(`
      (
        cm.name LIKE ?
        OR cm.company LIKE ?
        OR cm.business_email LIKE ?
        OR cm.phone_whatsapp LIKE ?
        OR cm.subject LIKE ?
        OR cm.message LIKE ?
      )
    `)

    values.push(
      searchValue,
      searchValue,
      searchValue,
      searchValue,
      searchValue,
      searchValue,
    )
  }

  /**
   * 状态筛选
   */
  if (status) {
    whereConditions.push(
      'cm.status = ?',
    )

    values.push(status)
  }

  const whereClause =
    whereConditions.length > 0
      ? `WHERE ${whereConditions.join(
          ' AND ',
        )}`
      : ''

  /**
   * 获取总数量
   */
  const [countRows] =
    await pool.query<
      RowDataPacket[]
    >(
      `
        SELECT COUNT(*) AS total
        FROM contact_messages cm
        ${whereClause}
      `,
      values,
    )

  const total = Number(
    countRows[0]?.total ?? 0,
  )

  /**
   * 分页计算
   */
  const offset =
    (page - 1) * pageSize

  /**
   * 获取留言列表
   */
  const [rows] =
    await pool.query<
      ContactMessageRow[]
    >(
      `
        SELECT
          cm.id,
          cm.name,
          cm.company,
          cm.business_email,
          cm.phone_whatsapp,
          cm.subject,
          cm.message,
          cm.status,
          cm.admin_note,
          cm.created_at,
          cm.updated_at
        FROM contact_messages cm
        ${whereClause}
        ORDER BY
          cm.created_at DESC,
          cm.id DESC
        LIMIT ?
        OFFSET ?
      `,
      [
        ...values,
        pageSize,
        offset,
      ],
    )

  const items =
    rows.map(
      mapContactMessage,
    )

  const totalPages =
    total > 0
      ? Math.ceil(
          total / pageSize,
        )
      : 0

  return {
    items,
    total,
    page,
    pageSize,
    totalPages,
  }
}

/**
 * 获取单条客户留言详情
 */
export async function getAdminContactMessageById(
  id: number,
): Promise<AdminContactMessage | null> {
  const [rows] =
    await pool.query<
      ContactMessageRow[]
    >(
      `
        SELECT
          id,
          name,
          company,
          business_email,
          phone_whatsapp,
          subject,
          message,
          status,
          admin_note,
          created_at,
          updated_at
        FROM contact_messages
        WHERE id = ?
        LIMIT 1
      `,
      [id],
    )

  if (rows.length === 0) {
    return null
  }

  return mapContactMessage(
    rows[0],
  )
}

/**
 * 修改客户留言
 *
 * 可以修改：
 * - status
 * - admin_note
 */
export async function updateAdminContactMessage(
  id: number,
  params: UpdateContactMessageParams,
): Promise<AdminContactMessage | null> {
  const fields: string[] = []
  const values: (
    string | number | null
  )[] = []

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
    params.adminNote !== undefined
  ) {
    fields.push(
      'admin_note = ?',
    )

    values.push(
      params.adminNote,
    )
  }

  /**
   * 理论上 Controller 已经做过校验，
   * Service 这里仍然保护一下。
   */
  if (fields.length === 0) {
    return getAdminContactMessageById(
      id,
    )
  }

  values.push(id)

  const [result] =
    await pool.execute<ResultSetHeader>(
      `
        UPDATE contact_messages
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

  return getAdminContactMessageById(
    id,
  )
}

/**
 * 删除客户留言
 */
export async function deleteAdminContactMessage(
  id: number,
): Promise<boolean> {
  const [result] =
    await pool.execute<ResultSetHeader>(
      `
        DELETE FROM contact_messages
        WHERE id = ?
      `,
      [id],
    )

  return result.affectedRows > 0
}

/**
 * 创建前台客户留言
 *
 * 前台 Contact.vue 提交留言时使用
 *
 * 注意：
 * - 前台只能创建留言
 * - status 不由前台传入
 * - 数据库默认 status = 'New'
 */
export interface CreateContactMessageParams {
  name: string
  company?: string | null
  businessEmail: string
  phoneWhatsapp?: string | null
  subject?: string | null
  message: string
}

export interface CreatedContactMessage {
  id: number
  name: string
  company: string | null
  businessEmail: string
  phoneWhatsapp: string | null
  subject: string | null
  message: string
  status: 'New'
}

export async function createContactMessage(
  params: CreateContactMessageParams,
): Promise<CreatedContactMessage> {
  const {
    name,
    company = null,
    businessEmail,
    phoneWhatsapp = null,
    subject = null,
    message,
  } = params

  const [result] =
    await pool.execute<ResultSetHeader>(
      `
        INSERT INTO contact_messages (
          name,
          company,
          business_email,
          phone_whatsapp,
          subject,
          message
        )
        VALUES (?, ?, ?, ?, ?, ?)
      `,
      [
        name,
        company,
        businessEmail,
        phoneWhatsapp,
        subject,
        message,
      ],
    )

  return {
    id: Number(result.insertId),
    name,
    company,
    businessEmail,
    phoneWhatsapp,
    subject,
    message,
    status: 'New',
  }
}

