import type { Request, Response } from 'express'

import {
  getProducts,
  getProductByPartNumber,
} from '../services/product.service.js'

export async function listProducts(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const search =
      typeof req.query.search === 'string'
        ? req.query.search.trim()
        : undefined

    const manufacturer =
      typeof req.query.manufacturer === 'string'
        ? req.query.manufacturer.trim()
        : undefined

    const category =
      typeof req.query.category === 'string'
        ? req.query.category.trim()
        : undefined

    const page =
      typeof req.query.page === 'string'
        ? Number(req.query.page)
        : undefined

    const pageSize =
      typeof req.query.pageSize === 'string'
        ? Number(req.query.pageSize)
        : undefined

    const result = await getProducts({
      search,
      manufacturer,
      category,
      page,
      pageSize,
    })

    res.json({
      success: true,
      data: result.data,
      pagination: {
        page: result.page,
        pageSize: result.pageSize,
        total: result.total,
        totalPages: result.totalPages,
      },
    })
  } catch (error) {
    console.error('Failed to fetch products:', error)

    res.status(500).json({
      success: false,
      message: 'Failed to fetch products',
    })
  }
}

export async function getProduct(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const rawPartNumber = req.params.partNumber

    const partNumber =
      typeof rawPartNumber === 'string'
        ? rawPartNumber.trim()
        : undefined

    if (!partNumber) {
      res.status(400).json({
        success: false,
        message: 'Part number is required',
      })

      return
    }

    const product = await getProductByPartNumber(partNumber)

    if (!product) {
      res.status(404).json({
        success: false,
        message: 'Product not found',
      })

      return
    }

    res.json({
      success: true,
      data: product,
    })
  } catch (error) {
    console.error('Failed to fetch product:', error)

    res.status(500).json({
      success: false,
      message: 'Failed to fetch product',
    })
  }
}
