const express = require("express");
const router = express.Router();
const crypto = require("node:crypto");
const { promisify } = require("node:util");
const User = require("../models/user");
const { createAccessToken } = require("../middleware/authorization");
const scrypt = promisify(crypto.scrypt);

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = await scrypt(password, salt, 64);
  return `scrypt$${salt}$${derivedKey.toString("hex")}`;
}

async function verifyPassword(password, storedPassword) {
  if (!storedPassword.startsWith("scrypt$")) {
    return { valid: password === storedPassword, needsUpgrade: true };
  }

  const [, salt, storedHash] = storedPassword.split("$");
  const derivedKey = await scrypt(password, salt, 64);
  const expected = Buffer.from(storedHash, "hex");
  return {
    valid: expected.length === derivedKey.length && crypto.timingSafeEqual(expected, derivedKey),
    needsUpgrade: false,
  };
}

// Register API
router.post("/register", async (req, res) => {
  try {
    const name = req.body.name?.trim();
    const email = req.body.email?.trim().toLowerCase();
    const password = req.body.password;

    if (!name || !email || typeof password !== "string" || password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Enter your name, a valid email, and a password with at least 8 characters",
      });
    }

    const user = new User({
      name,
      email,
      password: await hashPassword(password),
    });

    await user.save();

    res.status(201).json({
      success: true,
      message: "Account Created Successfully",
    });
  } catch (error) {
    console.log(error);

    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: "An account with this email already exists" });
    }

    res.status(500).json({
      success: false,
      message: "Registration Failed",
    });
  }
});
// Login API
router.post("/login", async (req, res) => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    const password = req.body.password;

    if (!email || typeof password !== "string" || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const passwordCheck = await verifyPassword(password, user.password);
    if (!passwordCheck.valid) {
      return res.status(401).json({
        success: false,
        message: "Incorrect password",
      });
    }

    if (passwordCheck.needsUpgrade) {
      user.password = await hashPassword(password);
      await user.save();
    }

    res.status(200).json({
      success: true,
      message: "Login Successful",
      token: createAccessToken(user),
      user: {
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Login Failed",
    });
  }
});

module.exports = router;