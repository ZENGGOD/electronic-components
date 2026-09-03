import type { RowDataPacket } from 'mysql2'
import pool from '../config/database.js'

export interface TechnicalTopicRow extends RowDataPacket {
  id: number
  categoryId: number | null

  slug: string

  titleZh: string
  titleEn: string

  descriptionZh: string | null
  descriptionEn: string | null

  status: number
  sortOrder: number

  createdAt?: Date
  updatedAt?: Date
}

export interface TechnicalCategoryRow extends RowDataPacket {
  id: number
  nameZh: string
  nameEn: string
  slug: string
}

export interface TechnicalProductRow extends RowDataPacket {
  id: number

  partNumber: string

  package: string | null

  titleZh: string
  titleEn: string

  descriptionZh: string | null
  descriptionEn: string | null

  status: string

  manufacturerId: number
  manufacturer: string

  categoryId: number
  category: string
}

export interface TechnicalTagRow extends RowDataPacket {
  id: number
  name: string
  slug: string
}

export interface TechnicalTopicDetail
  extends TechnicalTopicRow {
  category: TechnicalCategoryRow | null
  products: TechnicalProductRow[]
  tags: TechnicalTagRow[]
}

/**
 * 获取技术主题列表
 */
export async function getTechnicalTopics(): Promise<
  TechnicalTopicRow[]
> {
  const sql = `
    SELECT
      id,
      category_id AS categoryId,

      slug,

      title_zh AS titleZh,
      title_en AS titleEn,

      description_zh AS descriptionZh,
      description_en AS descriptionEn,

      status,
      sort_order AS sortOrder,

      created_at AS createdAt,
      updated_at AS updatedAt

    FROM technical_topics

    WHERE status = 1

    ORDER BY
      sort_order ASC,
      id ASC
  `

  const [rows] =
    await pool.query<TechnicalTopicRow[]>(sql)

  return rows
}

/**
 * 根据 slug 获取技术主题
 */
export async function getTechnicalTopicBySlug(
  slug: string,
): Promise<TechnicalTopicDetail | null> {
  const topicSql = `
    SELECT
      t.id,
      t.category_id AS categoryId,

      t.slug,

      t.title_zh AS titleZh,
      t.title_en AS titleEn,

      t.description_zh AS descriptionZh,
      t.description_en AS descriptionEn,

      t.status,
      t.sort_order AS sortOrder,

      t.created_at AS createdAt,
      t.updated_at AS updatedAt

    FROM technical_topics t

    WHERE
      t.slug = ?
      AND t.status = 1

    LIMIT 1
  `

  const [topicRows] =
    await pool.query<TechnicalTopicRow[]>(
      topicSql,
      [slug],
    )

  if (topicRows.length === 0) {
    return null
  }

  const topic = topicRows[0]

  /**
   * 获取分类
   */
  let category: TechnicalCategoryRow | null = null

  if (topic.categoryId !== null) {
    const categorySql = `
      SELECT
        id,
        name_zh AS nameZh,
        name_en AS nameEn,
        slug

      FROM categories

      WHERE
        id = ?
        AND status = 1

      LIMIT 1
    `

    const [categoryRows] =
      await pool.query<TechnicalCategoryRow[]>(
        categorySql,
        [topic.categoryId],
      )

    category =
      categoryRows.length > 0
        ? categoryRows[0]
        : null
  }

  /**
   * 获取关联产品
   */
  const productSql = `
    SELECT
      p.id,
      p.part_number AS partNumber,

      p.package,

      p.title_zh AS titleZh,
      p.title_en AS titleEn,

      p.description_zh AS descriptionZh,
      p.description_en AS descriptionEn,

      p.status,

      m.id AS manufacturerId,
      m.name AS manufacturer,

      c.id AS categoryId,
      c.name_zh AS category

    FROM technical_topic_products tp

    INNER JOIN products p
      ON tp.product_id = p.id

    INNER JOIN manufacturers m
      ON p.manufacturer_id = m.id

    INNER JOIN categories c
      ON p.category_id = c.id

    WHERE
      tp.topic_id = ?
      AND p.status <> 'Discontinued'

    ORDER BY
      tp.sort_order ASC,
      p.id ASC
  `

  const [products] =
    await pool.query<TechnicalProductRow[]>(
      productSql,
      [topic.id],
    )

  /**
   * 获取关联标签
   */
  const tagSql = `
    SELECT
      tg.id,
      tg.name_zh AS name,
      tg.slug

    FROM technical_topic_tags tt

    INNER JOIN tags tg
      ON tt.tag_id = tg.id

    WHERE
      tt.topic_id = ?

    ORDER BY
      tg.id ASC
  `

  const [tags] =
    await pool.query<TechnicalTagRow[]>(
      tagSql,
      [topic.id],
    )

  return {
    ...topic,
    category,
    products,
    tags,
  }
}
