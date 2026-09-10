import type { Request, Response } from 'express'

import {
  createContactMessage,
} from '../admin/services/contact-message.service.js'

function getString(value: unknown): string {
  return typeof value === 'string'
    ? value.trim()
    : ''
}

/**
 * 前台提交客户留言
 *
 * POST /api/contact
 */
export async function createContactMessageController(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const name = getString(
      req.body?.name,
    )

    const company = getString(
      req.body?.company,
    )

    const businessEmail = getString(
      req.body?.business_email,
    )

    const phoneWhatsapp = getString(
      req.body?.phone_whatsapp,
    )

    const subject = getString(
      req.body?.subject,
    )

    const message = getString(
      req.body?.message,
    )

    /**
     * 姓名
     */
    if (!name) {
      res.status(400).json({
        success: false,
        message: 'Name is required',
      })

      return
    }

    if (name.length > 150) {
      res.status(400).json({
        success: false,
        message:
          'Name cannot exceed 150 characters',
      })

      return
    }

    /**
     * 商务邮箱
     */
    if (!businessEmail) {
      res.status(400).json({
        success: false,
        message:
          'Business email is required',
      })

      return
    }

    if (businessEmail.length > 255) {
      res.status(400).json({
        success: false,
        message:
          'Business email cannot exceed 255 characters',
      })

      return
    }

    const emailPattern =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (
      !emailPattern.test(
        businessEmail,
      )
    ) {
      res.status(400).json({
        success: false,
        message:
          'Please provide a valid business email',
      })

      return
    }

    /**
     * 公司
     */
    if (company.length > 255) {
      res.status(400).json({
        success: false,
        message:
          'Company cannot exceed 255 characters',
      })

      return
    }

    /**
     * 电话 / WhatsApp
     */
    if (
      phoneWhatsapp.length > 100
    ) {
      res.status(400).json({
        success: false,
        message:
          'Phone or WhatsApp cannot exceed 100 characters',
      })

      return
    }

    /**
     * 主题
     */
    if (subject.length > 255) {
      res.status(400).json({
        success: false,
        message:
          'Subject cannot exceed 255 characters',
      })

      return
    }

    /**
     * 留言内容
     */
    if (!message) {
      res.status(400).json({
        success: false,
        message:
          'Message is required',
      })

      return
    }

    if (message.length > 10000) {
      res.status(400).json({
        success: false,
        message:
          'Message cannot exceed 10000 characters',
      })

      return
    }

    /**
     * 创建客户留言
     *
     * status 不由前台传入，
     * 数据库默认设置为 New。
     */
    const contactMessage =
      await createContactMessage({
        name,
        company:
          company || null,
        businessEmail,
        phoneWhatsapp:
          phoneWhatsapp || null,
        subject:
          subject || null,
        message,
      })

    res.status(201).json({
      success: true,
      message:
        'Contact message submitted successfully',
      data: contactMessage,
    })
  } catch (error) {
    console.error(
      'Create contact message error:',
      error,
    )

    res.status(500).json({
      success: false,
      message:
        'Failed to submit contact message',
    })
  }
}

