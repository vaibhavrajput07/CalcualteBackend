const express = require('express');
const bcrypt = require('bcryptjs');
const Password = require('../models/Password');
const router = express.Router();

// Route to set the password (this should only be called once during setup)
router.post('/set-password', async (req, res) => {
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

module.exports = router;
