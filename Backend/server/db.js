// db.js
require("dotenv").config();
const mongoose = require("mongoose");

// Connection options (removed deprecated options)
const connectionOptions = {
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  maxPoolSize: 10,
  minPoolSize: 5,
  maxIdleTimeMS: 30000
};

// Connect to main database for orders and users
const userConnection = mongoose.createConnection(process.env.MONGODB_URI, connectionOptions);

userConnection.on("connected", () => {
  console.log("✅ Main MongoDB connected successfully");
});

userConnection.on("error", (err) => {
  console.error("❌ Main MongoDB connection error:", err.message);
});

userConnection.on("disconnected", () => {
  console.log("⚠️ Main MongoDB disconnected");
});

// Connect to "Form" DB for worker data
const workerConnection = mongoose.createConnection(process.env.MONGO_URI_WORKERS, connectionOptions);

workerConnection.on("connected", () => {
  console.log("✅ Worker MongoDB connected (Form DB)");
});

workerConnection.on("error", (err) => {
  console.error("❌ Worker MongoDB connection error:", err.message);
});

workerConnection.on("disconnected", () => {
  console.log("⚠️ Worker MongoDB disconnected");
});

// Connect to "Form" DB for ticket data
const ticketConnection = mongoose.createConnection(process.env.MONGO_URI_TICKETS || process.env.MONGO_URI_WORKERS, connectionOptions);

ticketConnection.on("connected", () => {
  console.log("✅ Ticket MongoDB connected (Form DB)");
});

ticketConnection.on("error", (err) => {
  console.error("❌ Ticket MongoDB connection error:", err.message);
});

ticketConnection.on("disconnected", () => {
  console.log("⚠️ Ticket MongoDB disconnected");
});

// Reviews will use main MongoDB connection (no separate DB needed)

// Create models using the correct connections
const OrderSchema = require('./models/Order');
const Order = userConnection.model('Order', OrderSchema);

module.exports = { userConnection, workerConnection, ticketConnection, Order };
