const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

// Multer configuration for image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, "../uploads/reviews");
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "review-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

// Create direct connection to reviews MongoDB
const REVIEWS_URI = process.env.MONGO_URI_REVIEWS || 'mongodb+srv://altaf6090_db_user:k0pP31CzsqFvGCjZ@localconnectreviews.gn1s1vf.mongodb.net/reviews?retryWrites=true&w=majority&appName=LocalConnectReviews';

console.log('🔗 Connecting to reviews DB:', REVIEWS_URI.substring(0, 50) + '...');

const reviewsConnection = mongoose.createConnection(REVIEWS_URI, {
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  maxPoolSize: 10,
  minPoolSize: 5,
  maxIdleTimeMS: 30000
});

reviewsConnection.on("connected", () => {
  console.log("✅ Reviews MongoDB connected successfully");
});

reviewsConnection.on("error", (err) => {
  console.error("❌ Reviews MongoDB connection error:", err);
});

// Complete schema with ALL fields
const reviewSchema = new mongoose.Schema({
  worker_name: { type: String, required: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  written_review: { type: String, required: true },
  overall_satisfaction: { type: Number, required: true, min: 1, max: 5 },
  quality_of_work: { type: Number, min: 1, max: 5 },
  timeliness: { type: Number, min: 1, max: 5 },
  accuracy: { type: Number, min: 1, max: 5 },
  communication_skills: { type: Number, min: 1, max: 5 },
  product_name: String,
  consent_to_publish: { type: Boolean, default: true },
  is_anonymous: { type: Boolean, default: false },
  images: [{ type: String }]
}, {
  timestamps: true,
  collection: 'FormData'
});

const Review = reviewsConnection.model('Review', reviewSchema);

// POST /api/reviews - Create review
router.post("/", upload.array("reviewImages", 5), async (req, res) => {
  try {
    console.log("🔍 === REVIEW SUBMISSION DEBUG ===");
    console.log("📝 Raw req.body:", req.body);
    console.log("📝 Body keys:", Object.keys(req.body));
    console.log("📝 Body values:", Object.values(req.body));
    console.log("📁 Received files:", req.files ? req.files.length : 0);
    console.log("📁 Files details:", req.files ? req.files.map(f => ({ name: f.originalname, size: f.size })) : 'No files');
    console.log("🔗 Using reviewsConnection to database:", reviewsConnection.db.databaseName);
    console.log("🔍 === END DEBUG ===");
    
    // Validate required fields
    if (!req.body.worker_name || !req.body.name || !req.body.email || !req.body.written_review) {
      return res.status(400).json({ 
        error: "Missing required fields", 
        received: Object.keys(req.body),
        required: ['worker_name', 'name', 'email', 'written_review']
      });
    }
    
    // Create review data with explicit field mapping
    const reviewData = {
      worker_name: req.body.worker_name,
      name: req.body.name,
      email: req.body.email,
      written_review: req.body.written_review,
      overall_satisfaction: parseInt(req.body.overall_satisfaction) || 5,
      quality_of_work: parseInt(req.body.quality_of_work) || 5,
      timeliness: parseInt(req.body.timeliness) || 5,
      accuracy: parseInt(req.body.accuracy) || 5,
      communication_skills: parseInt(req.body.communication_skills) || 5,
      product_name: req.body.product_name || 'N/A',
      consent_to_publish: req.body.consent_to_publish == '1' || req.body.consent_to_publish === true,
      is_anonymous: req.body.is_anonymous == '1' || req.body.is_anonymous === true,
      images: req.files ? req.files.map(file => `/uploads/reviews/${file.filename}`) : []
    };
    
    console.log("💾 Saving review data:", reviewData);
    const review = new Review(reviewData);
    const saved = await review.save();
    
    console.log("✅ Review saved successfully!");
    console.log("📍 Saved to collection:", review.collection.name);
    console.log("🆔 Review ID:", saved._id);
    
    res.json({ success: true, id: saved._id, message: "Review saved to FormData collection" });
  } catch (error) {
    console.error("❌ Save error:", error);
    res.status(500).json({ error: error.message, details: error.stack });
  }
});

// GET /api/reviews - Get all reviews
router.get("/", async (req, res) => {
  try {
    const reviews = await Review.find().sort({ createdAt: -1 });
    res.json({ success: true, reviews });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/reviews/published - Get published reviews only
router.get("/published", async (req, res) => {
  try {
    const reviews = await Review.find({
      consent_to_publish: true,
      is_anonymous: false
    }).sort({ createdAt: -1 });
    res.json({ success: true, reviews });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;