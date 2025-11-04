const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const { userConnection } = require("../db");
const createUserModel = require("../models/User");
const User = createUserModel(userConnection);

// Sign Up
router.post("/signup", async (req, res) => {
  try {
    const { username, phone, email, password } = req.body;
    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ username }, { email }],
    });
    if (existingUser) {
      return res.status(400).json({ error: "Username or email already taken" });
    }
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    // Create new user
    const newUser = new User({
      username,
      phone,
      email,
      password: hashedPassword,
    });
    await newUser.save();
    return res.status(201).json({ message: "User created successfully" });
  } catch (error) {
    console.error("Signup error:", error);
    return res.status(500).json({ error: "Server error" });
  }
});

// Login - updated to accept either username or email
router.post("/login", async (req, res) => {
  try {
    const { identifier, password } = req.body;
    console.log("Login attempt with identifier:", identifier);
    
    // Check if identifier is empty
    if (!identifier) {
      return res.status(400).json({ error: "Username or email is required" });
    }
    
    // Find user by username or email
    const user = await User.findOne({
      $or: [
        { username: identifier },
        { email: identifier }
      ]
    });
    
    if (!user) {
      console.log("User not found with identifier:", identifier);
      return res.status(401).json({ error: "Invalid credentials" });
    }
    
    console.log("User found:", user.username);
    
    // Compare password - try direct comparison first for imported data
    let isMatch = false;
    
    // Try direct comparison (in case of imported data without hashing)
    if (password === user.password) {
      console.log("Direct password match");
      isMatch = true;
    } else {
      // Try bcrypt comparison for hashed passwords
      try {
        isMatch = await bcrypt.compare(password, user.password);
        console.log("Bcrypt comparison result:", isMatch);
      } catch (err) {
        console.error("Bcrypt comparison failed:", err);
      }
    }
    
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    
    // Generate JWT
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    
    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        username: user.username,
        email: user.email,
        phone: user.phone,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ error: "Server error" });
  }
});

// Get current user profile
router.get("/current", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    console.log('Auth header:', authHeader);
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: "No valid token provided" });
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    res.json({
      name: user.username,
      email: user.email,
      phone: user.phone
    });
  } catch (error) {
    console.error("Get current user error:", error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: "Invalid token" });
    }
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
