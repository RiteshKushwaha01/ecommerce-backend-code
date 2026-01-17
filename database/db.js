import pkg from 'pg'
const { Client } = pkg
import { config } from 'dotenv'

config()

const database = new Client({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  ssl: {
    required: true,
  },
})

// Create a connection promise
const connectDatabase = async () => {
  try {
    await database.connect()
    console.log('Connected to the database successfully')
    return database
  } catch (error) {
    console.error('Database connection failed:', error)
    process.exit(1)
  }
}

// Connect immediately
await connectDatabase()

export default database
