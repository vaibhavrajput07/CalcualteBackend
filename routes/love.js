const express = require('express');
const bcrypt = require('bcryptjs');
const Password =require('../models/Password');
const Love = require('../models/Love');
const router = express.Router();

// Middleware to check password
// const authenticatePassword = async (req, res, next) => {
//   const { password } = req.body;

//   if (!password) {
//     return res.status(400).json({ error: "Password is required!" });
//   }

//   try {
//     // Fetch the stored password record from DB
//     const passwordRecord = await Password.findOne();

//     if (!passwordRecord) {
//       return res.status(500).json({ error: "Password record not found!" });
//     }

//     const isMatch = await bcrypt.compare(password, passwordRecord.password);

//     if (!isMatch) {
//       return res.status(401).json({ error: "Invalid password" });
//     }

//     next(); // Proceed to the next middleware (get love data)
//   } catch (err) {
//     return res.status(500).json({ error: "Failed to authenticate password" });
//   }
// };

// Secure API to fetch all love records
router.post("/get-love-data", async (req, res) => {
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


// API endpoint to save love data
router.post("/save-love", async (req, res) => {
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

// Delete API
// router.delete("/delete-love/:id", async (req, res) => {
//   try {
//     await Love.findByIdAndDelete(req.params.id);
//     res.json({ message: "Record deleted successfully!" });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Failed to delete record" });
//   }
// });

router.delete("/delete-love/:id", async (req, res) => {
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



module.exports = router;
