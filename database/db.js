// import pkg from 'pg'
// const { Client } = pkg
// import { config } from 'dotenv'

// config()

// const database = new Client({
//   user: process.env.DB_USER,
//   host: process.env.DB_HOST,
//   database: process.env.DB_NAME,
//   password: process.env.DB_PASSWORD,
//   port: process.env.DB_PORT,
//   ssl: {
//     required: true,
//   },
// })

// // Create a connection promise
// const connectDatabase = async () => {
//   try {
//     await database.connect()
//     console.log('Connected to the database successfully')
//     return database
//   } catch (error) {
//     console.error('Database connection failed:', error)
//     process.exit(1)
//   }
// }

// // Connect immediately
// await connectDatabase()

// export default database

import { config } from 'dotenv'
import pkg from 'pg'

const { Pool } = pkg

config()

/* ----------------------------------
   Validate DATABASE_URL
---------------------------------- */
if (!process.env.DATABASE_URL) {
  throw new Error('❌ DATABASE_URL is missing in environment variables')
}

/* ----------------------------------
   Create Neon-compatible pool
---------------------------------- */
const database = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    require: true,
    rejectUnauthorized: false,
  },
})

/* ----------------------------------
   Test Connection
---------------------------------- */
database
  .query('SELECT 1')
  .then(() => console.log('✅ Neon database connected'))
  .catch((err) => {
    console.error('❌ Neon DB connection failed:', err)
    process.exit(1)
  })

export default database
