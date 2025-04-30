require('dotenv').config();
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const Password = require('./models/Password');
const Love = require('./models/Love');

// Initialize the Express app
const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(bodyParser.json());
app.use(cors());

app.use(cors({
  origin: "https://calculatefrontend.onrender.com",
  credentials: true
}));


// MongoDB connection
const dbURI = process.env.ATLASDB_URL;
mongoose.connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("✅ MongoDB connected successfully");
  })
  .catch(err => {
    console.error("❌ MongoDB connection error:", err);
  });

// Password-related routes
app.post('/password/set-password', async (req, res) => {
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ error: "Password is required!" });
  }

  // Hash the password before saving
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const passwordRecord = new Password({
      password: hashedPassword,
    });

    await passwordRecord.save();
    res.status(201).json({ message: "Password set successfully!" });
  } catch (err) {
    res.status(500).json({ error: "Failed to set the password" });
  }
});

// Love-related routes
app.post('/love/save-love', async (req, res) => {
  const { yourName, partnerName } = req.body;

  // Validation checks
  if (!yourName || !partnerName) {
    return res.status(400).json({ error: "Both names are required!" });
  }

  if (yourName === partnerName) {
    return res.status(400).json({ error: "Names cannot be the same!" });
  }

  const nameRegex = /^[A-Za-z\s]+$/;  // Allow alphabetic characters and spaces
  if (!nameRegex.test(yourName) || !nameRegex.test(partnerName)) {
    return res.status(400).json({ error: "Names can only contain letters and spaces!" });
  }

  // Normalize the names to lowercase for case-insensitive comparison
  const normalizedYourName = yourName.toLowerCase();
  const normalizedPartnerName = partnerName.toLowerCase();

  // Check if this combination of names already exists in the database (case insensitive)
  try {
    const existingRecord = await Love.findOne({
      $or: [
        { yourName: normalizedYourName, partnerName: normalizedPartnerName },
        { yourName: normalizedPartnerName, partnerName: normalizedYourName }
      ]
    });

    if (existingRecord) {
      return res.status(400).json({ error: "This love combination already exists!" });
    }

    // Create a new Love document if it doesn't already exist
    const newLove = new Love({
      yourName,
      partnerName
    });

    await newLove.save();
    res.status(201).json({ message: "Love data saved successfully!" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Failed to save love data!" });
  }
});

// Secure API to fetch all love records
app.post('/love/get-love-data', async (req, res) => {
  const { enteredPassword } = req.body;

  if (!enteredPassword) {
    return res.status(400).json({ error: "Password is required" });
  }

  try {
    // Get the stored hashed password from DB
    const passwordRecord = await Password.findOne();
    if (!passwordRecord) {
      return res.status(500).json({ error: "Password not set in database" });
    }

    // Compare entered password with stored hash
    const isMatch = await bcrypt.compare(enteredPassword, passwordRecord.password);

    if (!isMatch) {
      return res.status(401).json({ error: "Invalid Password" });
    }

    // If password matches, fetch and return the love data
    const loveRecords = await Love.find().sort({ createdAt: -1 });
    res.json(loveRecords);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Delete Love record by ID
app.delete('/love/:id', async (req, res) => {
  const loveId = req.params.id;

  if (!loveId) {
    return res.status(400).json({ error: "ID parameter is missing" });
  }

  try {
    const deleted = await Love.findByIdAndDelete(loveId);

    if (!deleted) {
      return res.status(404).json({ error: "Record not found" });
    }

    res.json({ message: "Record deleted successfully!" });
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ✅ Serve frontend in production (Vite: dist folder)
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '../frontend/dist');
  const indexHtmlPath = path.join(distPath, 'index.html');

  if (fs.existsSync(indexHtmlPath)) {
    app.use(express.static(distPath));

    app.get('*', (req, res) => {
      res.sendFile(indexHtmlPath);
    });
  } else {
    console.warn("⚠️ 'dist/index.html' not found. Please run 'npm run build' in the frontend.");
  }
}

// Start the server
app.listen(port, () => {
  console.log(`🚀 Server is running on port ${port}`);
});
