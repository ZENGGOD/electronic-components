import type { Request, Response } from 'express'

import {
  getAdminContactMessages,
  getAdminContactMessageById,
  updateAdminContactMessage,
  deleteAdminContactMessage,
  type ContactMessageStatus,
} from '../services/contact-message.service.js'

const CONTACT_MESSAGE_STATUSES: ContactMessageStatus[] = [
  'New',
  'Processing',
  'Replied',
  'Closed',
]

function parsePositiveInt(
  value: unknown,
): number | null {
  const number = Number(value)

  if (
    !Number.isInteger(number) ||
    number <= 0
  ) {
    return null
  }

  return number
}

/**
 * 获取客户留言列表
 */
export async function getContactMessages(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const page =
      parsePositiveInt(req.query.page) ?? 1

    const pageSize =
      parsePositiveInt(req.query.pageSize) ?? 20

    const keyword =
      typeof req.query.keyword === 'string'
        ? req.query.keyword.trim()
        : ''

    const status =
      typeof req.query.status === 'string' &&
      CONTACT_MESSAGE_STATUSES.includes(
        req.query.status as ContactMessageStatus,
      )
        ? (req.query.status as ContactMessageStatus)
        : undefined

    const result =
      await getAdminContactMessages({
        page,
        pageSize,
        keyword:
          keyword || undefined,
        status,
      })

    res.json({
      success: true,
      data: result,
    })
  } catch (error) {
    console.error(
      'Get admin contact messages error:',
      error,
    )

    res.status(500).json({
      success: false,
      message:
        'Failed to fetch contact messages',
    })
  }
}

/**
 * 获取客户留言详情
 */
export async function getContactMessage(
  req: Request,
  res: Response,
): Promise<void> {
  const id = parsePositiveInt(
    req.params.id,
  )

  if (id === null) {
    res.status(400).json({
      success: false,
      message:
        'Invalid contact message ID',
    })

    return
  }

  try {
    const message =
      await getAdminContactMessageById(
        id,
      )

    if (!message) {
      res.status(404).json({
        success: false,
        message:
          'Contact message not found',
      })

      return
    }

    res.json({
      success: true,
      data: message,
    })
  } catch (error) {
    console.error(
      'Get admin contact message error:',
      error,
    )

    res.status(500).json({
      success: false,
      message:
        'Failed to fetch contact message',
    })
  }
}

/**
 * 修改客户留言
 */
export async function updateContactMessage(
  req: Request,
  res: Response,
): Promise<void> {
  const id = parsePositiveInt(
    req.params.id,
  )

  if (id === null) {
    res.status(400).json({
      success: false,
      message:
        'Invalid contact message ID',
    })

    return
  }

  const {
    status,
    adminNote,
  } = req.body ?? {}

  /**
   * 校验状态
   */
  if (
    status !== undefined &&
    !CONTACT_MESSAGE_STATUSES.includes(
      status as ContactMessageStatus,
    )
  ) {
    res.status(400).json({
      success: false,
      message:
        'Invalid contact message status',
    })

    return
  }

  /**
   * 校验管理员备注
   */
  if (
    adminNote !== undefined &&
    adminNote !== null &&
    typeof adminNote !== 'string'
  ) {
    res.status(400).json({
      success: false,
      message:
        'Admin note must be a string or null',
    })

    return
  }

  /**
   * 至少修改一个字段
   */
  if (
    status === undefined &&
    adminNote === undefined
  ) {
    res.status(400).json({
      success: false,
      message:
        'At least one field must be provided',
    })

    return
  }

  try {
    const updated =
      await updateAdminContactMessage(
        id,
        {
          status:
            status as
              | ContactMessageStatus
              | undefined,

          adminNote:
            adminNote === null
              ? null
              : adminNote,
        },
      )

    if (!updated) {
      res.status(404).json({
        success: false,
        message:
          'Contact message not found',
      })

      return
    }

    res.json({
      success: true,
      data: updated,
      message:
        'Contact message updated successfully',
    })
  } catch (error) {
    console.error(
      'Update admin contact message error:',
      error,
    )

    res.status(500).json({
      success: false,
      message:
        'Failed to update contact message',
    })
  }
}

/**
 * 删除客户留言
 */
export async function deleteContactMessage(
  req: Request,
  res: Response,
): Promise<void> {
  const id = parsePositiveInt(
    req.params.id,
  )

  if (id === null) {
    res.status(400).json({
      success: false,
      message:
        'Invalid contact message ID',
    })

    return
  }

  try {
    const deleted =
      await deleteAdminContactMessage(
        id,
      )

    if (!deleted) {
      res.status(404).json({
        success: false,
        message:
          'Contact message not found',
      })

      return
    }

    res.json({
      success: true,
      message:
        'Contact message deleted successfully',
    })
  } catch (error) {
    console.error(
      'Delete admin contact message error:',
      error,
    )

    res.status(500).json({
      success: false,
      message:
        'Failed to delete contact message',
    })
  }
}
