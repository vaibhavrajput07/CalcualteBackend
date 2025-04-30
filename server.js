require('dotenv').config();

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
  const frontendPath = path.join(__dirname, '..', 'frontend', 'dist');  // Change to dist
  app.use(express.static(frontendPath));

  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
}

const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require('path');

const port = process.env.PORT || 5000;

// Import route files
const loveRoutes = require('./routes/love');
const passwordRoutes = require('./routes/Password');

// Initialize the Express app
const app = express();

// Middleware
app.use(bodyParser.json());
app.use(cors());

// Route prefixes
app.use('/love', loveRoutes);          // Example: /api/love/save-love
app.use('/password', passwordRoutes);  // Example: /api/password/set-password

// MongoDB connection
const dbURI = process.env.ATLASDB_URL;
mongoose.connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("✅ MongoDB connected successfully");
  })
  .catch(err => {
    console.error("❌ MongoDB connection error:", err);
  });

// Start the server

app.listen(port, () => {
  console.log(`🚀 Server is running on port ${port}`);
});
