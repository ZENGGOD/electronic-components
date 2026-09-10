import express from 'express'
import cors from 'cors'
import path from 'node:path'
import multer from 'multer'

import productRoutes from './routes/product.routes.js'
import manufacturerRoutes from './routes/manufacturer.routes.js'
import categoryRoutes from './routes/category.routes.js'
import technicalRoutes from './routes/technical.routes.js'
import contactMessageRoutes from './routes/contact-message.routes.js'

import adminAuthRoutes from './admin/routes/admin-auth.routes.js'
import adminRoutes from './admin/routes/admin.routes.js'
import dashboardRoutes from './admin/routes/dashboard.routes.js'
import adminProductRoutes from './admin/routes/product.routes.js'

import adminManufacturerRoutes from './admin/routes/manufacturer.routes.js'
import adminCategoryRoutes from './admin/routes/category.routes.js'
import adminQuoteRequestRoutes from './admin/routes/quote-request.routes.js'
import adminContactMessageRoutes from './admin/routes/contact-message.routes.js'

const app = express()

// ─────────────────────────────────────────────
// CORS
// ─────────────────────────────────────────────

app.use(
  cors({
    origin: 'http://localhost:5173',
  }),
)

// ─────────────────────────────────────────────
// JSON Parser
// ─────────────────────────────────────────────

app.use(express.json())

// ─────────────────────────────────────────────
// Static uploaded files
// ─────────────────────────────────────────────

app.use(
  '/uploads',
  express.static(
    path.resolve(
      process.cwd(),
      'uploads',
    ),
  ),
)

// ─────────────────────────────────────────────
// Health Check
// ─────────────────────────────────────────────

app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    message:
      'Electronic Components API is running',
  })
})

// ─────────────────────────────────────────────
// Public API Routes
// ─────────────────────────────────────────────

app.use(
  '/api/products',
  productRoutes,
)

app.use(
  '/api/manufacturers',
  manufacturerRoutes,
)

app.use(
  '/api/categories',
  categoryRoutes,
)

app.use(
  '/api/technical',
  technicalRoutes,
)

app.use(
  '/api/contact',
  contactMessageRoutes,
)
// ─────────────────────────────────────────────
// Admin API Routes
// ─────────────────────────────────────────────

app.use(
  '/api/admin/auth',
  adminAuthRoutes,
)

app.use(
  '/api/admin',
  adminRoutes,
)

app.use(
  '/api/admin/dashboard',
  dashboardRoutes,
)

app.use(
  '/api/admin/products',
  adminProductRoutes,
)

app.use(
  '/api/admin/manufacturers',
  adminManufacturerRoutes,
)

app.use(
  '/api/admin/categories',
  adminCategoryRoutes,
)

app.use(
  '/api/admin/quote-requests',
  adminQuoteRequestRoutes,
)

app.use(
  '/api/admin/contact-messages',
  adminContactMessageRoutes,
)
// ─────────────────────────────────────────────
// Global Error Handler
// ─────────────────────────────────────────────

app.use(
  (
    error: unknown,
    _req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    // ─────────────────────────────────────────
    // Multer Error
    // ─────────────────────────────────────────

    if (
      error instanceof multer.MulterError
    ) {
      // File size > 10MB
      if (
        error.code ===
        'LIMIT_FILE_SIZE'
      ) {
        res.status(400).json({
          success: false,
          message:
            '图片大小不能超过 10MB',
        })

        return
      }

      // Other Multer errors
      res.status(400).json({
        success: false,
        message:
          '图片上传失败',
      })

      return
    }

    // ─────────────────────────────────────────
    // Image Format Error
    // ─────────────────────────────────────────

    if (error instanceof Error) {
      if (
        error.message ===
        '仅支持 JPG、JPEG、PNG、WEBP 格式的图片'
      ) {
        res.status(400).json({
          success: false,
          message:
            error.message,
        })

        return
      }
    }

    // ─────────────────────────────────────────
    // Unknown Error
    // ─────────────────────────────────────────

    console.error(
      'Unhandled server error:',
      error,
    )

    // 如果响应还没有发送
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message:
          'Internal server error',
      })

      return
    }

    // 如果响应已经发送，继续交给 Express
    next(error)
  },
)

export default app
