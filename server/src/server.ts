import dotenv from 'dotenv'
import app from './app.js'
import pool from './config/database.js'

dotenv.config()

const PORT = Number(process.env.PORT) || 3000

async function startServer() {
  try {
    const connection = await pool.getConnection()

    await connection.query('SELECT 1')

    connection.release()

    console.log('MySQL database connected successfully')

    app.listen(PORT, () => {
      console.log(`API server running at http://localhost:${PORT}`)
    })
  } catch (error) {
    console.error('Failed to connect to MySQL:', error)
    process.exit(1)
  }
}

startServer()
