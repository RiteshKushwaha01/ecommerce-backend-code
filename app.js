import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import fileUpload from 'express-fileupload'
import { createTables } from './utils/createTables.js'
import { errorMiddleware } from './middlewares/errorMiddlewares.js'
import authRouter from './routes/authRoutes.js'
import productRouter from './routes/productRoutes.js'
import adminRouter from './routes/adminRoutes.js'
import orderRouter from './routes/orderRoutes.js'
import Stripe from 'stripe'
import database from './database/db.js'
import { config } from 'dotenv'

const app = express()

config()

// CORS configuration with fallback values
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  process.env.DASHBOARD_URL || 'http://localhost:5174',
  'http://localhost:3000', // Common React dev port
  'http://localhost:5173', // Vite default port
].filter(Boolean) // Remove any undefined values

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true)

      if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
        callback(null, true)
      } else {
        console.warn(`CORS blocked origin: ${origin}`)
        callback(null, true) // Allow all origins in development for easier debugging
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
)

// Webhook handler (supports both /api/v1/payment/webhook and /app/v1/payment/webhook)
const stripeWebhookHandler = async (req, res) => {
  const sig = req.headers['stripe-signature']
  let event
  try {
    event = Stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET,
    )
  } catch (error) {
    console.warn('Stripe webhook signature verification failed:', error.message)
    return res.status(400).send(`Webhook Error: ${error.message || error}`)
  }

  console.log(`Received Stripe event: ${event.type} [${event.id}]`)

  // Handling the Event
  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent_client_secret = event.data.object.client_secret
    try {
      // FINDING AND UPDATED PAYMENT
      const updatedPaymentStatus = 'Paid'
      const paymentTableUpdateResult = await database.query(
        `UPDATE payments SET payment_status = $1 WHERE payment_intent_id = $2 RETURNING *`,
        [updatedPaymentStatus, paymentIntent_client_secret],
      )
      await database.query(
        `UPDATE orders SET paid_at = NOW() WHERE id = $1 RETURNING *`,
        [paymentTableUpdateResult.rows[0].order_id],
      )

      // Reduce Stock For Each Product
      const orderId = paymentTableUpdateResult.rows[0].order_id

      const { rows: orderedItems } = await database.query(
        `
          SELECT product_id, quantity FROM order_items WHERE order_id = $1
        `,
        [orderId],
      )

      // For each ordered item, reduce the product stock
      for (const item of orderedItems) {
        await database.query(
          `UPDATE products SET stock = stock - $1 WHERE id = $2`,
          [item.quantity, item.product_id],
        )
      }
    } catch (error) {
      console.error('Error handling payment_intent.succeeded webhook:', error)
      return res
        .status(500)
        .send(`Error updating paid_at timestamp in orders table.`)
    }
  }
  res.status(200).send({ received: true })
}

app.post(
  '/api/v1/payment/webhook',
  express.raw({ type: 'application/json' }),
  stripeWebhookHandler,
)
app.post(
  '/app/v1/payment/webhook',
  express.raw({ type: 'application/json' }),
  stripeWebhookHandler,
)

app.use(cookieParser())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use(
  fileUpload({
    tempFileDir: './uploads',
    useTempFiles: true,
  }),
)

// Health check endpoint
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  })
})

// Get Stripe publishable key
app.get('/api/v1/payment/config', (req, res) => {
  res.status(200).json({
    success: true,
    publishableKey: process.env.STRIPE_FRONTEND_KEY || '',
  })
})

app.use('/api/v1/auth', authRouter)
app.use('/api/v1/product', productRouter)
app.use('/api/v1/admin', adminRouter)
app.use('/api/v1/order', orderRouter)

app.use(errorMiddleware)

export default app
