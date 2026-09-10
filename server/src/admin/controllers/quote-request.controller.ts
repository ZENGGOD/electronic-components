import type { Request, Response } from 'express'

import {
  getAdminQuoteRequests,
  getAdminQuoteRequestById,
  updateAdminQuoteRequest,
  deleteAdminQuoteRequest,
  type QuoteRequestStatus,
} from '../services/quote-request.service.js'

const QUOTE_REQUEST_STATUSES: QuoteRequestStatus[] = [
  'New',
  'Processing',
  'Quoted',
  'Completed',
  'Cancelled',
]

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

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

// ─────────────────────────────────────────────
// Get Quote Request List
// GET /api/admin/quote-requests
// ─────────────────────────────────────────────

export async function getQuoteRequests(
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
      QUOTE_REQUEST_STATUSES.includes(
        req.query.status as QuoteRequestStatus,
      )
        ? (req.query.status as QuoteRequestStatus)
        : undefined

    const result =
      await getAdminQuoteRequests({
        page,
        pageSize,
        keyword: keyword || undefined,
        status,
      })

    res.json({
      success: true,
      data: result,
    })
  } catch (error) {
    console.error(
      'Get admin quote requests error:',
      error,
    )

    res.status(500).json({
      success: false,
      message: 'Failed to fetch quote requests',
    })
  }
}

// ─────────────────────────────────────────────
// Get Quote Request Detail
// GET /api/admin/quote-requests/:id
// ─────────────────────────────────────────────

export async function getQuoteRequest(
  req: Request,
  res: Response,
): Promise<void> {
  const id = parsePositiveInt(req.params.id)

  if (id === null) {
    res.status(400).json({
      success: false,
      message: 'Invalid quote request ID',
    })
    return
  }

  try {
    const quoteRequest =
      await getAdminQuoteRequestById(id)

    if (!quoteRequest) {
      res.status(404).json({
        success: false,
        message: 'Quote request not found',
      })
      return
    }

    res.json({
      success: true,
      data: quoteRequest,
    })
  } catch (error) {
    console.error(
      'Get admin quote request error:',
      error,
    )

    res.status(500).json({
      success: false,
      message: 'Failed to fetch quote request',
    })
  }
}

// ─────────────────────────────────────────────
// Update Quote Request
// PUT /api/admin/quote-requests/:id
// ─────────────────────────────────────────────

export async function updateQuoteRequest(
  req: Request,
  res: Response,
): Promise<void> {
  const id = parsePositiveInt(req.params.id)

  if (id === null) {
    res.status(400).json({
      success: false,
      message: 'Invalid quote request ID',
    })
    return
  }

  const { status, adminNote } =
    req.body ?? {}

  if (
    status !== undefined &&
    !QUOTE_REQUEST_STATUSES.includes(
      status as QuoteRequestStatus,
    )
  ) {
    res.status(400).json({
      success: false,
      message: 'Invalid quote request status',
    })
    return
  }

  if (
    adminNote !== undefined &&
    adminNote !== null &&
    typeof adminNote !== 'string'
  ) {
    res.status(400).json({
      success: false,
      message: 'Admin note must be a string or null',
    })
    return
  }

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
      await updateAdminQuoteRequest(id, {
        status:
          status as QuoteRequestStatus | undefined,
        adminNote:
          adminNote === null
            ? null
            : adminNote,
      })

    if (!updated) {
      res.status(404).json({
        success: false,
        message: 'Quote request not found',
      })
      return
    }

    res.json({
      success: true,
      data: updated,
      message: 'Quote request updated successfully',
    })
  } catch (error) {
    console.error(
      'Update admin quote request error:',
      error,
    )

    res.status(500).json({
      success: false,
      message: 'Failed to update quote request',
    })
  }
}

// ─────────────────────────────────────────────
// Delete Quote Request
// DELETE /api/admin/quote-requests/:id
// ─────────────────────────────────────────────

export async function deleteQuoteRequest(
  req: Request,
  res: Response,
): Promise<void> {
  const id = parsePositiveInt(req.params.id)

  if (id === null) {
    res.status(400).json({
      success: false,
      message: 'Invalid quote request ID',
    })
    return
  }

  try {
    const deleted =
      await deleteAdminQuoteRequest(id)

    if (!deleted) {
      res.status(404).json({
        success: false,
        message: 'Quote request not found',
      })
      return
    }

    res.json({
      success: true,
      message: 'Quote request deleted successfully',
    })
  } catch (error) {
    console.error(
      'Delete admin quote request error:',
      error,
    )

    res.status(500).json({
      success: false,
      message: 'Failed to delete quote request',
    })
  }
}
