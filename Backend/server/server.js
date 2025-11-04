require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const app = express();

// Combined CORS configuration:
// - Uses a function to dynamically allow origins:
//   - Always allows requests with no origin (mobile, curl, etc.).
//   - Allows any localhost origin.
//   - Allows 'https://your-production-domain.com' and 'http://localhost:5173'.
// - Also explicitly limits the HTTP methods.
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (e.g., mobile apps, curl requests)
    if (!origin) return callback(null, true);

    // Allow all localhost origins regardless of port
    if (origin.startsWith('http://localhost:')) {
      return callback(null, true);
    }

    // Allowed domains
    const allowedDomains = [
      'https://local-connect-e-commerce-1e6u.onrender.com',
      'http://localhost:5173'
    ];
    if (allowedDomains.indexOf(origin) !== -1) {
      return callback(null, true);
    }

    // Not allowed by CORS
    callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  credentials: true
}));

// Parse JSON for non-file routes (Multer handles multipart/form-data)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logger middleware
app.use((req, res, next) => {
  const startTime = new Date();
  console.log(`📥 ${req.method} ${req.originalUrl} - ${startTime.toISOString()}`);
  
  // Log request body for debugging (only for POST requests)
  if (req.method === 'POST' && req.originalUrl.includes('/api/reviews')) {
    console.log('📋 Request headers:', req.headers);
    console.log('📋 Content-Type:', req.get('Content-Type'));
  }

  // Log details after the response finishes
  res.on('finish', () => {
    const duration = new Date() - startTime;
    console.log(`📤 ${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`);
  });
  
  next();
});

// Serve static files from the uploads folder
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Serve review images specifically
app.use("/uploads/reviews", express.static(path.join(__dirname, "uploads/reviews")));

// Add a specific route for review images to ensure they're properly served
app.get('/uploads/reviews/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, 'uploads', 'reviews', filename);
  res.sendFile(filePath);
});

// Add a route to handle legacy absolute paths
app.get('/api/image/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, 'uploads', 'reviews', filename);
  res.sendFile(filePath);
});

// Create uploads directory if it does not exist
const uploadsDir = path.join(__dirname, "uploads");
const reviewsDir = path.join(uploadsDir, "reviews");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('Created uploads directory');
}

// Initialize database connections
const { userConnection, workerConnection, ticketConnection } = require("./db");

// Import route modules
const authRoutes = require("./routes/auth");
const workerAuthRoutes = require("./routes/workerAuth");
const workerFormRoutes = require("./routes/WorkerForm");
const ticketRoutes = require("./routes/tickets");
const reviewRoutes = require("./routes/simple-reviews");
const orderRoutes = require("./routes/orders");
const stripeRoutes = require("./routes/stripe");

// Use the routes with prefixed paths
app.use("/api/auth", authRoutes);
app.use("/api/worker-auth", workerAuthRoutes);
app.use("/api/users", authRoutes);
app.use("/api/worker-form", workerFormRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api", stripeRoutes);

// Health-check endpoint for quick server status
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    time: new Date().toISOString()
  });
});

// Default route for testing
app.get('/', (req, res) => {
  res.send('API server is running!');
});

// 404 handler: handles routes that are not defined
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Not Found - ${req.originalUrl}`
  });
});

// Global error handler for catching all errors
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err : undefined
  });
});

// Start the server and listen on API_SERVER_PORT to avoid conflicts with the Stripe server
const PORT = process.env.PORT || process.env.API_SERVER_PORT || 5003;

const server = app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🛠️  API Endpoints available at /api`);
  console.log(`🔍 Health check at /health`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Process terminated');
    process.exit(0);
  });
});
