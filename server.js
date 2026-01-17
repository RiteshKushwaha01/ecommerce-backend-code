// import dotenv from 'dotenv'
// dotenv.config({ path: './config/config.env' })

// import app from './app.js'
// import { v2 as cloudinary } from 'cloudinary'
// import database from './database/db.js'
// import { createTables } from './utils/createTables.js'

// cloudinary.config({
//   cloud_name: process.env.CLOUDINARY_CLIENT_NAME,
//   api_key: process.env.CLOUDINARY_CLIENT_API,
//   api_secret: process.env.CLOUDINARY_CLIENT_SECRET,
// })

// // Create tables after database connection is established
// // The database connection is already established in db.js with top-level await
// // console.log('Creating database tables...')
// await createTables()

// const PORT = process.env.PORT || 4000

// app.listen(PORT, () => {
//   console.log(`✅ Server is running on port ${PORT}`)
//   console.log(`📍 Health check: http://localhost:${PORT}/api/v1/health`)
//   console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`)
//   console.log(`🔐 CORS enabled for: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`)
// })

import dotenv from 'dotenv'

/* ----------------------------------
   ENV CONFIG (Render + Local Safe)
---------------------------------- */
dotenv.config({
  path: process.env.NODE_ENV === 'production' ? '.env' : './config/config.env',
})

import app from './app.js'
import { v2 as cloudinary } from 'cloudinary'
import database from './database/db.js'
import { createTables } from './utils/createTables.js'

/* ----------------------------------
   CLOUDINARY CONFIG
---------------------------------- */
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLIENT_NAME,
  api_key: process.env.CLOUDINARY_CLIENT_API,
  api_secret: process.env.CLOUDINARY_CLIENT_SECRET,
})

/* ----------------------------------
   START SERVER SAFELY
---------------------------------- */
const PORT = process.env.PORT || 4000

const startServer = async () => {
  try {
    // ✅ Ensure DB is connected
    await database.query('SELECT 1')
    console.log('✅ Database connected')

    // ✅ Create tables ONCE (safe for Neon)
    await createTables()
    console.log('✅ Tables verified/created')

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`)
      console.log(`📍 Health: /api/v1/health`)
      console.log(`🌐 Frontend: ${process.env.FRONTEND_URL}`)
      console.log(`📊 Dashboard: ${process.env.DASHBOARD_URL}`)
      console.log(`🔐 Environment: ${process.env.NODE_ENV || 'development'}`)
    })
  } catch (error) {
    console.error('❌ Server startup failed:', error)
    process.exit(1)
  }
}

startServer()
