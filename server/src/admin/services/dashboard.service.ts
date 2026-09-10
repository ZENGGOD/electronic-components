import type { RowDataPacket } from 'mysql2'

import pool from '../../config/database.js'

interface CountRow extends RowDataPacket {
  count: number
}

export interface DashboardStats {
  products: number
  manufacturers: number
  categories: number
  technicalTopics: number
  quoteRequests: number
  contactMessages: number
}

async function getCount(
  tableName: string,
): Promise<number> {
  const [rows] = await pool.query<CountRow[]>(
    `SELECT COUNT(*) AS count FROM ${tableName}`,
  )

  return Number(rows[0]?.count ?? 0)
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const [
    products,
    manufacturers,
    categories,
    technicalTopics,
    quoteRequests,
    contactMessages,
  ] = await Promise.all([
    getCount('products'),
    getCount('manufacturers'),
    getCount('categories'),
    getCount('technical_topics'),
    getCount('quote_requests'),
    getCount('contact_messages'),
  ])

  return {
    products,
    manufacturers,
    categories,
    technicalTopics,
    quoteRequests,
    contactMessages,
  }
}
