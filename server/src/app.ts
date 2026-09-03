import express from 'express'
import cors from 'cors'

import productRoutes from './routes/product.routes.js'
import manufacturerRoutes from './routes/manufacturer.routes.js'
import categoryRoutes from './routes/category.routes.js'
import technicalRoutes from './routes/technical.routes.js'

const app = express()

app.use(
  cors({
    origin: 'http://localhost:5173',
  }),
)

app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    message: 'Electronic Components API is running',
  })
})

app.use('/api/products', productRoutes)
app.use('/api/manufacturers', manufacturerRoutes)
app.use('/api/categories', categoryRoutes)
app.use('/api/technical', technicalRoutes)

export default app
