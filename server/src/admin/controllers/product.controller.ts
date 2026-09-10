import type { Request, Response } from 'express'

import {
  createAdminProduct,
  deleteAdminProduct,
  deleteAdminProducts,
  getAdminProductById,
  getAdminProducts,
  updateAdminProduct,
} from '../services/product.service.js'

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function parsePositiveInteger(
  value: unknown,
): number | undefined {
  const numberValue = Number(value)

  if (
    !Number.isInteger(numberValue) ||
    numberValue <= 0
  ) {
    return undefined
  }

  return numberValue
}

function parseNonNegativeInteger(
  value: unknown,
): number | undefined {
  const numberValue = Number(value)

  if (
    !Number.isInteger(numberValue) ||
    numberValue < 0
  ) {
    return undefined
  }

  return numberValue
}

function getErrorMessage(
  error: unknown,
): string {
  if (error instanceof Error) {
    return error.message
  }

  return 'Unknown error'
}

// ─────────────────────────────────────────────
// Get Products
// GET /api/admin/products
// ─────────────────────────────────────────────

export async function getProducts(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const page = Math.max(
      Number(req.query.page) || 1,
      1,
    )

    const pageSize = Math.min(
      Math.max(
        Number(req.query.pageSize) || 10,
        1,
      ),
      100,
    )

    const search =
      typeof req.query.search === 'string'
        ? req.query.search.trim()
        : undefined

    const manufacturerId =
      req.query.manufacturerId
        ? Number(req.query.manufacturerId)
        : undefined

    const categoryId =
      req.query.categoryId
        ? Number(req.query.categoryId)
        : undefined

    const status =
      typeof req.query.status === 'string'
        ? req.query.status as
            | 'In Stock'
            | 'Available'
            | 'Request Quote'
            | 'Discontinued'
        : undefined

    const result =
      await getAdminProducts({
        page,
        pageSize,
        search,
        manufacturerId,
        categoryId,
        status,
      })

    res.json({
      success: true,
      message:
        'Products retrieved successfully',
      data: result,
    })
  } catch (error) {
    console.error(
      'Failed to fetch admin products:',
      error,
    )

    res.status(500).json({
      success: false,
      message:
        'Failed to fetch products',
    })
  }
}

// ─────────────────────────────────────────────
// Get Product
// GET /api/admin/products/:id
// ─────────────────────────────────────────────

export async function getProduct(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const id = parsePositiveInteger(
      req.params.id,
    )

    if (!id) {
      res.status(400).json({
        success: false,
        message: 'Invalid product id',
      })

      return
    }

    const product =
      await getAdminProductById(id)

    if (!product) {
      res.status(404).json({
        success: false,
        message: 'Product not found',
      })

      return
    }

    res.json({
      success: true,
      message:
        'Product retrieved successfully',
      data: product,
    })
  } catch (error) {
    console.error(
      'Failed to fetch admin product:',
      error,
    )

    res.status(500).json({
      success: false,
      message:
        'Failed to fetch product',
    })
  }
}

// ─────────────────────────────────────────────
// Create Product
// POST /api/admin/products
// ─────────────────────────────────────────────

export async function createProduct(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const {
      partNumber,
      manufacturerId,
      categoryId,
      package: packageName,
      titleZh,
      titleEn,
      descriptionZh,
      descriptionEn,
      status,
      stockQuantity,
      unit,
      datasheetUrl,
      imageUrl,
      isFeatured,
      sortOrder,
    } = req.body ?? {}

    // ─────────────────────────────────────────
    // Required fields
    // ─────────────────────────────────────────

    if (
      typeof partNumber !== 'string' ||
      !partNumber.trim()
    ) {
      res.status(400).json({
        success: false,
        message:
          'Part number is required',
      })

      return
    }

    if (
      typeof titleZh !== 'string' ||
      !titleZh.trim()
    ) {
      res.status(400).json({
        success: false,
        message:
          'Chinese title is required',
      })

      return
    }

    if (
      typeof titleEn !== 'string' ||
      !titleEn.trim()
    ) {
      res.status(400).json({
        success: false,
        message:
          'English title is required',
      })

      return
    }

    // ─────────────────────────────────────────
    // Manufacturer
    // ─────────────────────────────────────────

    const parsedManufacturerId =
      parsePositiveInteger(
        manufacturerId,
      )

    if (!parsedManufacturerId) {
      res.status(400).json({
        success: false,
        message:
          'Valid manufacturer id is required',
      })

      return
    }

    // ─────────────────────────────────────────
    // Category
    // ─────────────────────────────────────────

    const parsedCategoryId =
      parsePositiveInteger(
        categoryId,
      )

    if (!parsedCategoryId) {
      res.status(400).json({
        success: false,
        message:
          'Valid category id is required',
      })

      return
    }

    // ─────────────────────────────────────────
    // Status
    // ─────────────────────────────────────────

    const validStatuses = [
      'In Stock',
      'Available',
      'Request Quote',
      'Discontinued',
    ] as const

    type ValidStatus =
      (typeof validStatuses)[number]

    let parsedStatus:
      | ValidStatus
      | undefined

    if (status !== undefined) {
      if (
        typeof status !== 'string' ||
        !validStatuses.includes(
          status as ValidStatus,
        )
      ) {
        res.status(400).json({
          success: false,
          message:
            'Invalid product status',
        })

        return
      }

      parsedStatus =
        status as ValidStatus
    }

    // ─────────────────────────────────────────
    // Stock Quantity
    // ─────────────────────────────────────────

    let parsedStockQuantity:
      | number
      | null
      | undefined

    if (
      stockQuantity === null ||
      stockQuantity === undefined ||
      stockQuantity === ''
    ) {
      parsedStockQuantity = null
    } else {
      parsedStockQuantity =
        parseNonNegativeInteger(
          stockQuantity,
        )

      if (
        parsedStockQuantity === undefined
      ) {
        res.status(400).json({
          success: false,
          message:
            'Stock quantity must be a non-negative integer',
        })

        return
      }
    }

    // ─────────────────────────────────────────
    // Sort Order
    // ─────────────────────────────────────────

    let parsedSortOrder:
      | number
      | undefined

    if (
      sortOrder === null ||
      sortOrder === undefined ||
      sortOrder === ''
    ) {
      parsedSortOrder = 0
    } else {
      parsedSortOrder =
        parseNonNegativeInteger(
          sortOrder,
        )

      if (
        parsedSortOrder === undefined
      ) {
        res.status(400).json({
          success: false,
          message:
            'Sort order must be a non-negative integer',
        })

        return
      }
    }

    // ─────────────────────────────────────────
    // Create
    // ─────────────────────────────────────────

    const product =
      await createAdminProduct({
        partNumber:
          partNumber.trim(),

        manufacturerId:
          parsedManufacturerId,

        categoryId:
          parsedCategoryId,

        package:
          typeof packageName === 'string'
            ? packageName.trim() || null
            : null,

        titleZh:
          titleZh.trim(),

        titleEn:
          titleEn.trim(),

        descriptionZh:
          typeof descriptionZh ===
          'string'
            ? descriptionZh.trim() || null
            : null,

        descriptionEn:
          typeof descriptionEn ===
          'string'
            ? descriptionEn.trim() || null
            : null,

        status:
          parsedStatus,

        stockQuantity:
          parsedStockQuantity,

        unit:
          typeof unit === 'string'
            ? unit.trim() || 'pcs'
            : 'pcs',

        datasheetUrl:
          typeof datasheetUrl === 'string'
            ? datasheetUrl.trim() || null
            : null,

        imageUrl:
          typeof imageUrl === 'string'
            ? imageUrl.trim() || null
            : null,

        isFeatured:
          isFeatured === true ||
          Number(isFeatured) === 1,

        sortOrder:
          parsedSortOrder,
      })

    res.status(201).json({
      success: true,
      message:
        'Product created successfully',
      data: product,
    })
  } catch (error) {
    const message =
      getErrorMessage(error)

    console.error(
      'Failed to create admin product:',
      error,
    )

    if (
      message ===
      'Product part number already exists'
    ) {
      res.status(409).json({
        success: false,
        message,
      })

      return
    }

    if (
      message ===
        'Manufacturer not found' ||
      message ===
        'Category not found'
    ) {
      res.status(400).json({
        success: false,
        message,
      })

      return
    }

    res.status(500).json({
      success: false,
      message:
        'Failed to create product',
    })
  }
}

// ─────────────────────────────────────────────
// Update Product
// PUT /api/admin/products/:id
// ─────────────────────────────────────────────

export async function updateProduct(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const id = parsePositiveInteger(
      req.params.id,
    )

    if (!id) {
      res.status(400).json({
        success: false,
        message: 'Invalid product id',
      })

      return
    }

    const {
      partNumber,
      manufacturerId,
      categoryId,
      package: packageName,
      titleZh,
      titleEn,
      descriptionZh,
      descriptionEn,
      status,
      stockQuantity,
      unit,
      datasheetUrl,
      imageUrl,
      isFeatured,
      sortOrder,
    } = req.body ?? {}

    // ─────────────────────────────────────────
    // Required fields
    // ─────────────────────────────────────────

    if (
      typeof partNumber !== 'string' ||
      !partNumber.trim()
    ) {
      res.status(400).json({
        success: false,
        message:
          'Part number is required',
      })

      return
    }

    if (
      typeof titleZh !== 'string' ||
      !titleZh.trim()
    ) {
      res.status(400).json({
        success: false,
        message:
          'Chinese title is required',
      })

      return
    }

    if (
      typeof titleEn !== 'string' ||
      !titleEn.trim()
    ) {
      res.status(400).json({
        success: false,
        message:
          'English title is required',
      })

      return
    }

    // ─────────────────────────────────────────
    // Manufacturer
    // ─────────────────────────────────────────

    const parsedManufacturerId =
      parsePositiveInteger(
        manufacturerId,
      )

    if (!parsedManufacturerId) {
      res.status(400).json({
        success: false,
        message:
          'Valid manufacturer id is required',
      })

      return
    }

    // ─────────────────────────────────────────
    // Category
    // ─────────────────────────────────────────

    const parsedCategoryId =
      parsePositiveInteger(
        categoryId,
      )

    if (!parsedCategoryId) {
      res.status(400).json({
        success: false,
        message:
          'Valid category id is required',
      })

      return
    }

    // ─────────────────────────────────────────
    // Status
    // ─────────────────────────────────────────

    const validStatuses = [
      'In Stock',
      'Available',
      'Request Quote',
      'Discontinued',
    ] as const

    type ValidStatus =
      (typeof validStatuses)[number]

    let parsedStatus:
      | ValidStatus
      | undefined

    if (status !== undefined) {
      if (
        typeof status !== 'string' ||
        !validStatuses.includes(
          status as ValidStatus,
        )
      ) {
        res.status(400).json({
          success: false,
          message:
            'Invalid product status',
        })

        return
      }

      parsedStatus =
        status as ValidStatus
    }

    // ─────────────────────────────────────────
    // Stock Quantity
    // ─────────────────────────────────────────

    let parsedStockQuantity:
      | number
      | null
      | undefined

    if (
      stockQuantity === null ||
      stockQuantity === undefined ||
      stockQuantity === ''
    ) {
      parsedStockQuantity = null
    } else {
      parsedStockQuantity =
        parseNonNegativeInteger(
          stockQuantity,
        )

      if (
        parsedStockQuantity === undefined
      ) {
        res.status(400).json({
          success: false,
          message:
            'Stock quantity must be a non-negative integer',
        })

        return
      }
    }

    // ─────────────────────────────────────────
    // Sort Order
    // ─────────────────────────────────────────

    let parsedSortOrder:
      | number
      | undefined

    if (
      sortOrder === null ||
      sortOrder === undefined ||
      sortOrder === ''
    ) {
      parsedSortOrder = 0
    } else {
      parsedSortOrder =
        parseNonNegativeInteger(
          sortOrder,
        )

      if (
        parsedSortOrder === undefined
      ) {
        res.status(400).json({
          success: false,
          message:
            'Sort order must be a non-negative integer',
        })

        return
      }
    }

    // ─────────────────────────────────────────
    // Update
    // ─────────────────────────────────────────

    const product =
      await updateAdminProduct(
        id,
        {
          partNumber:
            partNumber.trim(),

          manufacturerId:
            parsedManufacturerId,

          categoryId:
            parsedCategoryId,

          package:
            typeof packageName ===
            'string'
              ? packageName.trim() ||
                null
              : null,

          titleZh:
            titleZh.trim(),

          titleEn:
            titleEn.trim(),

          descriptionZh:
            typeof descriptionZh ===
            'string'
              ? descriptionZh.trim() ||
                null
              : null,

          descriptionEn:
            typeof descriptionEn ===
            'string'
              ? descriptionEn.trim() ||
                null
              : null,

          status:
            parsedStatus,

          stockQuantity:
            parsedStockQuantity,

          unit:
            typeof unit === 'string'
              ? unit.trim() || 'pcs'
              : 'pcs',

          datasheetUrl:
            typeof datasheetUrl ===
            'string'
              ? datasheetUrl.trim() ||
                null
              : null,

          imageUrl:
            typeof imageUrl ===
            'string'
              ? imageUrl.trim() ||
                null
              : null,

          isFeatured:
            isFeatured === undefined
              ? undefined
              : isFeatured === true ||
                Number(isFeatured) === 1,

          sortOrder:
            parsedSortOrder,
        },
      )

    if (!product) {
      res.status(404).json({
        success: false,
        message: 'Product not found',
      })

      return
    }

    res.json({
      success: true,
      message:
        'Product updated successfully',
      data: product,
    })
  } catch (error) {
    const message =
      getErrorMessage(error)

    console.error(
      'Failed to update admin product:',
      error,
    )

    if (
      message ===
      'Product not found'
    ) {
      res.status(404).json({
        success: false,
        message,
      })

      return
    }

    if (
      message ===
      'Product part number already exists'
    ) {
      res.status(409).json({
        success: false,
        message,
      })

      return
    }

    if (
      message ===
        'Manufacturer not found' ||
      message ===
        'Category not found'
    ) {
      res.status(400).json({
        success: false,
        message,
      })

      return
    }

    res.status(500).json({
      success: false,
      message:
        'Failed to update product',
    })
  }
}

// ─────────────────────────────────────────────
// Delete Product
// DELETE /api/admin/products/:id
// ─────────────────────────────────────────────

export async function deleteProduct(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const id = parsePositiveInteger(
      req.params.id,
    )

    if (!id) {
      res.status(400).json({
        success: false,
        message: 'Invalid product id',
      })

      return
    }

    const deleted =
      await deleteAdminProduct(id)

    if (!deleted) {
      res.status(404).json({
        success: false,
        message: 'Product not found',
      })

      return
    }

    res.json({
      success: true,
      message:
        'Product deleted successfully',
    })
  } catch (error) {
    const message =
      getErrorMessage(error)

    console.error(
      'Failed to delete admin product:',
      error,
    )

    if (
      message ===
      'Product not found'
    ) {
      res.status(404).json({
        success: false,
        message,
      })

      return
    }

    res.status(500).json({
      success: false,
      message:
        'Failed to delete product',
    })
  }
}

// ─────────────────────────────────────────────
// Delete Products In Batch
// DELETE /api/admin/products/batch
// ─────────────────────────────────────────────

export async function deleteProducts(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const { ids } = req.body ?? {}

    // ─────────────────────────────────────────
    // Validate ids
    // ─────────────────────────────────────────

    if (!Array.isArray(ids)) {
      res.status(400).json({
        success: false,
        message:
          'Product ids must be an array',
      })

      return
    }

    if (ids.length === 0) {
      res.status(400).json({
        success: false,
        message:
          'At least one product id is required',
      })

      return
    }

    // ─────────────────────────────────────────
    // Parse and validate every ID
    // ─────────────────────────────────────────

    const parsedIds: number[] = []

    for (const value of ids) {
      const id =
        parsePositiveInteger(value)

      if (!id) {
        res.status(400).json({
          success: false,
          message:
            'Product ids must be positive integers',
        })

        return
      }

      parsedIds.push(id)
    }

    // ─────────────────────────────────────────
    // Remove duplicate IDs
    // ─────────────────────────────────────────

    const uniqueIds =
      [...new Set(parsedIds)]

    // ─────────────────────────────────────────
    // Delete
    // ─────────────────────────────────────────

    const deletedCount =
      await deleteAdminProducts(
        uniqueIds,
      )

    // ─────────────────────────────────────────
    // Response
    // ─────────────────────────────────────────

    res.json({
      success: true,
      message:
        'Products deleted successfully',
      data: {
        deletedCount,
      },
    })
  } catch (error) {
    console.error(
      'Failed to delete admin products:',
      error,
    )

    res.status(500).json({
      success: false,
      message:
        'Failed to delete products',
    })
  }
}


// ─────────────────────────────────────────────
// Upload Product Image
// POST /api/admin/products/upload-image
// ─────────────────────────────────────────────

export async function uploadProductImage(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    if (!req.file) {
      res.status(400).json({
        success: false,
        message:
          'Product image is required',
      })

      return
    }

    const imageUrl =
      `/uploads/products/${req.file.filename}`

    res.status(201).json({
      success: true,
      message:
        'Product image uploaded successfully',
      data: {
        imageUrl,
      },
    })
  } catch (error) {
    console.error(
      'Failed to upload product image:',
      error,
    )

    res.status(500).json({
      success: false,
      message:
        'Failed to upload product image',
    })
  }
}
