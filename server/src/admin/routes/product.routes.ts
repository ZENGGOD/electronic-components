import { Router } from 'express'

import {
  createProduct,
  deleteProduct,
  deleteProducts,
  getProduct,
  getProducts,
  updateProduct,
  uploadProductImage,
} from '../controllers/product.controller.js'

import {
  authenticateAdmin,
} from '../middlewares/admin-auth.middleware.js'

import {
  uploadProductImageMiddleware,
} from '../middlewares/upload.middleware.js'

const router = Router()

// Upload product image

router.post(
  '/upload-image',
  authenticateAdmin,
  uploadProductImageMiddleware.single(
    'image',
  ),
  uploadProductImage,
)

// Product list

router.get(
  '/',
  authenticateAdmin,
  getProducts,
)

// Product detail

router.get(
  '/:id',
  authenticateAdmin,
  getProduct,
)

// Create product

router.post(
  '/',
  authenticateAdmin,
  createProduct,
)

// Update product

router.put(
  '/:id',
  authenticateAdmin,
  updateProduct,
)

// Delete products in batch
// DELETE /api/admin/products/batch

router.delete(
  '/batch',
  authenticateAdmin,
  deleteProducts,
)

// Delete product
// DELETE /api/admin/products/:id

router.delete(
  '/:id',
  authenticateAdmin,
  deleteProduct,
)

export default router

