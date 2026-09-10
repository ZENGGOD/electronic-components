import type {
  Request,
  Response,
} from 'express'

import {
  createAdminManufacturer,
  deleteAdminManufacturer,
  getAdminManufacturerById,
  getAdminManufacturers,
  updateAdminManufacturer,
} from '../services/manufacturer.service.js'

function parsePositiveInteger(
  value: unknown,
): number | null {
  const parsed =
    Number(value)

  if (
    !Number.isInteger(parsed) ||
    parsed <= 0
  ) {
    return null
  }

  return parsed
}

function parseStatus(
  value: unknown,
): number | undefined {
  if (
    value === undefined ||
    value === null ||
    value === ''
  ) {
    return undefined
  }

  const status =
    Number(value)

  if (
    status !== 0 &&
    status !== 1
  ) {
    return undefined
  }

  return status
}

/**
 * GET /api/admin/manufacturers
 */
export async function getManufacturers(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const page =
      Number(req.query.page) || 1

    const pageSize =
      Number(req.query.pageSize) || 20

    const keyword =
      typeof req.query.keyword === 'string'
        ? req.query.keyword
        : undefined

    const status =
      parseStatus(req.query.status)

    const result =
      await getAdminManufacturers({
        page,
        pageSize,
        keyword,
        status,
      })

    res.json({
      success: true,
      data: result,
    })
  } catch (error) {
    console.error(
      'Failed to get admin manufacturers:',
      error,
    )

    res.status(500).json({
      success: false,
      message:
        'Failed to fetch manufacturers',
    })
  }
}

/**
 * GET /api/admin/manufacturers/:id
 */
export async function getManufacturer(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const id =
      parsePositiveInteger(
        req.params.id,
      )

    if (!id) {
      res.status(400).json({
        success: false,
        message:
          'Manufacturer id must be a positive integer',
      })

      return
    }

    const manufacturer =
      await getAdminManufacturerById(id)

    if (!manufacturer) {
      res.status(404).json({
        success: false,
        message:
          'Manufacturer not found',
      })

      return
    }

    res.json({
      success: true,
      data: manufacturer,
    })
  } catch (error) {
    console.error(
      'Failed to get admin manufacturer:',
      error,
    )

    res.status(500).json({
      success: false,
      message:
        'Failed to fetch manufacturer',
    })
  }
}

/**
 * POST /api/admin/manufacturers
 */
export async function createManufacturer(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const {
      name,
      code,
      logoUrl,
      website,
      description,
      status,
      sortOrder,
    } = req.body ?? {}

    if (
      typeof name !== 'string' ||
      !name.trim()
    ) {
      res.status(400).json({
        success: false,
        message:
          'Manufacturer name is required',
      })

      return
    }

    if (
      code !== undefined &&
      code !== null &&
      typeof code !== 'string'
    ) {
      res.status(400).json({
        success: false,
        message:
          'Manufacturer code must be a string',
      })

      return
    }

    if (
      logoUrl !== undefined &&
      logoUrl !== null &&
      typeof logoUrl !== 'string'
    ) {
      res.status(400).json({
        success: false,
        message:
          'Logo URL must be a string',
      })

      return
    }

    if (
      website !== undefined &&
      website !== null &&
      typeof website !== 'string'
    ) {
      res.status(400).json({
        success: false,
        message:
          'Website must be a string',
      })

      return
    }

    if (
      description !== undefined &&
      description !== null &&
      typeof description !== 'string'
    ) {
      res.status(400).json({
        success: false,
        message:
          'Description must be a string',
      })

      return
    }

    const parsedStatus =
      status === undefined ||
      status === null ||
      status === ''
        ? undefined
        : parseStatus(status)

    if (
      status !== undefined &&
      status !== null &&
      status !== '' &&
      parsedStatus === undefined
    ) {
      res.status(400).json({
        success: false,
        message:
          'Manufacturer status must be 0 or 1',
      })

      return
    }

    const parsedSortOrder =
      sortOrder === undefined ||
      sortOrder === null ||
      sortOrder === ''
        ? undefined
        : Number(sortOrder)

    if (
      parsedSortOrder !== undefined &&
      !Number.isInteger(
        parsedSortOrder,
      )
    ) {
      res.status(400).json({
        success: false,
        message:
          'Sort order must be an integer',
      })

      return
    }

    const manufacturer =
      await createAdminManufacturer({
        name,
        code,
        logoUrl,
        website,
        description,
        status: parsedStatus,
        sortOrder:
          parsedSortOrder,
      })

    res.status(201).json({
      success: true,
      message:
        'Manufacturer created successfully',
      data: manufacturer,
    })
  } catch (error) {
    console.error(
      'Failed to create admin manufacturer:',
      error,
    )

    const message =
      error instanceof Error
        ? error.message
        : ''

    if (
      message.includes(
        'Duplicate entry',
      )
    ) {
      res.status(409).json({
        success: false,
        message:
          'Manufacturer name or code already exists',
      })

      return
    }

    res.status(500).json({
      success: false,
      message:
        'Failed to create manufacturer',
    })
  }
}

/**
 * PUT /api/admin/manufacturers/:id
 */
export async function updateManufacturer(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const id =
      parsePositiveInteger(
        req.params.id,
      )

    if (!id) {
      res.status(400).json({
        success: false,
        message:
          'Manufacturer id must be a positive integer',
      })

      return
    }

    const {
      name,
      code,
      logoUrl,
      website,
      description,
      status,
      sortOrder,
    } = req.body ?? {}

    if (
      name !== undefined &&
      (
        typeof name !== 'string' ||
        !name.trim()
      )
    ) {
      res.status(400).json({
        success: false,
        message:
          'Manufacturer name must be a non-empty string',
      })

      return
    }

    if (
      code !== undefined &&
      code !== null &&
      typeof code !== 'string'
    ) {
      res.status(400).json({
        success: false,
        message:
          'Manufacturer code must be a string',
      })

      return
    }

    if (
      logoUrl !== undefined &&
      logoUrl !== null &&
      typeof logoUrl !== 'string'
    ) {
      res.status(400).json({
        success: false,
        message:
          'Logo URL must be a string',
      })

      return
    }

    if (
      website !== undefined &&
      website !== null &&
      typeof website !== 'string'
    ) {
      res.status(400).json({
        success: false,
        message:
          'Website must be a string',
      })

      return
    }

    if (
      description !== undefined &&
      description !== null &&
      typeof description !== 'string'
    ) {
      res.status(400).json({
        success: false,
        message:
          'Description must be a string',
      })

      return
    }

    const parsedStatus =
      status === undefined ||
      status === null ||
      status === ''
        ? undefined
        : parseStatus(status)

    if (
      status !== undefined &&
      status !== null &&
      status !== '' &&
      parsedStatus === undefined
    ) {
      res.status(400).json({
        success: false,
        message:
          'Manufacturer status must be 0 or 1',
      })

      return
    }

    const parsedSortOrder =
      sortOrder === undefined ||
      sortOrder === null ||
      sortOrder === ''
        ? undefined
        : Number(sortOrder)

    if (
      parsedSortOrder !== undefined &&
      !Number.isInteger(
        parsedSortOrder,
      )
    ) {
      res.status(400).json({
        success: false,
        message:
          'Sort order must be an integer',
      })

      return
    }

    const manufacturer =
      await updateAdminManufacturer(
        id,
        {
          name,
          code,
          logoUrl,
          website,
          description,
          status: parsedStatus,
          sortOrder:
            parsedSortOrder,
        },
      )

    if (!manufacturer) {
      res.status(404).json({
        success: false,
        message:
          'Manufacturer not found',
      })

      return
    }

    res.json({
      success: true,
      message:
        'Manufacturer updated successfully',
      data: manufacturer,
    })
  } catch (error) {
    console.error(
      'Failed to update admin manufacturer:',
      error,
    )

    const message =
      error instanceof Error
        ? error.message
        : ''

    if (
      message.includes(
        'Duplicate entry',
      )
    ) {
      res.status(409).json({
        success: false,
        message:
          'Manufacturer name or code already exists',
      })

      return
    }

    res.status(500).json({
      success: false,
      message:
        'Failed to update manufacturer',
    })
  }
}

/**
 * DELETE /api/admin/manufacturers/:id
 */
export async function deleteManufacturer(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const id =
      parsePositiveInteger(
        req.params.id,
      )

    if (!id) {
      res.status(400).json({
        success: false,
        message:
          'Manufacturer id must be a positive integer',
      })

      return
    }

    const deleted =
      await deleteAdminManufacturer(id)

    if (!deleted) {
      res.status(404).json({
        success: false,
        message:
          'Manufacturer not found',
      })

      return
    }

    res.json({
      success: true,
      message:
        'Manufacturer deleted successfully',
    })
  } catch (error) {
    console.error(
      'Failed to delete admin manufacturer:',
      error,
    )

    res.status(500).json({
      success: false,
      message:
        'Failed to delete manufacturer',
    })
  }
}
