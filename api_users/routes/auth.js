const dns = require("node:dns").promises
dns.setServers(["1.1.1.1"])
const express = require("express")
const router = express.Router()
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const passport = require("passport")
const GoogleStrategy = require("passport-google-oauth20").Strategy
const User = require("../models/user")

function buildFrontendRedirect(searchParams = {}) {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173"
  const redirectUrl = new URL(frontendUrl)

  Object.entries(searchParams).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      redirectUrl.searchParams.set(key, value)
    }
  })

  return redirectUrl.toString()
}

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL || "/auth/google/callback"
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value
        if (!email) {
          return done(new Error("Google did not return an email"), null)
        }

        // Find user by email and auto-create when missing.
        let user = await User.findOne({ email })
        if (!user) {
          user = new User({
            name: profile.displayName || "Google User",
            email,
            passwordHash: "",
            authProvider: "google"
          })
          await user.save()
        }

        return done(null, user)
      } catch (error) {
        return done(error, null)
      }
    }
  )
)

// POST /register - Create user with hashed password
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body
    
    // Validate required fields.
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" })
    }

    // Check if user already exists.
    const userExists = await User.findOne({ email })
    if (userExists) {
      return res.status(409).json({ message: "Email already registered" })
    }

    // Hash password using bcrypt.
    const passwordHash = await bcrypt.hash(password, 10)

    // Create and save user.
    const user = new User({ 
      name, 
      email, 
      passwordHash 
    })
    await user.save()

    res.status(201).json({ 
      message: "User created successfully", 
      userId: user._id 
    })
  } catch (error) {
    console.error("Error registering user:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// POST /login - Authenticate user and return JWT
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body
    
    // Validate required fields.
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" })
    }

    // Find user by email.
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" })
    }

    if (!user.passwordHash) {
      return res.status(401).json({ message: "Use Google sign-in for this account" })
    }

    // Compare submitted password with hash.
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash)
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid email or password" })
    }

    // Generate JWT valid for 7 days.
    const token = jwt.sign(
      { userId: user._id }, 
      process.env.JWT_SECRET || "secret_key_default",
      { expiresIn: "7d" }
    )

    res.status(200).json({ 
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    })
  } catch (error) {
    console.error("Error logging in:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// GET /auth/google - Start Google OAuth
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"], session: false })
)

// GET /auth/google/callback - Google callback and JWT issue
router.get(
  "/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: "/auth/google/failure" }),
  async (req, res) => {
    try {
      const token = jwt.sign(
        { userId: req.user._id },
        process.env.JWT_SECRET || "secret_key_default",
        { expiresIn: "7d" }
      )

      const userPayload = JSON.stringify({
        id: req.user._id,
        name: req.user.name,
        email: req.user.email
      })

      // Redirect back to frontend with token/user payload.
      return res.redirect(
        buildFrontendRedirect({
          token,
          user: userPayload
        })
      )
    } catch (error) {
      console.error("Google callback error:", error)
      return res.redirect(buildFrontendRedirect({ oauthError: "callback_failed" }))
    }
  }
)

// GET /auth/google/failure - Social login failure handler
router.get("/google/failure", (_req, res) => {
  return res.redirect(buildFrontendRedirect({ oauthError: "google_auth_failed" }))
})

module.exports = router
