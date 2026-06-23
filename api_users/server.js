
const dns = require("node:dns").promises
dns.setServers(["1.1.1.1"])
require("dotenv").config()
const express = require("express")
const cors = require("cors")
const passport = require("passport")
const connectDB = require("./db")
const userRoutes = require("./routes/users") 
const authRoutes = require("./routes/auth")
const bookingRoutes = require("./routes/bookings")
const { isEmailConfigured, isEmailReady, verifyEmailTransport } = require("./email")

const app = express()

const corsOrigins = (process.env.CORS_ORIGINS || "http://localhost:5173,https://patriciagea.github.io")
	.split(",")
	.map((origin) => origin.trim())
	.filter(Boolean)

app.use(cors({ origin: corsOrigins }))
app.use(express.json())
app.use(passport.initialize())

const PORT = process.env.PORT || 3000


connectDB()
verifyEmailTransport()


app.get("/health", (_req, res) => {
	res.status(200).json({
		status: "ok",
		emailConfigured: isEmailConfigured(),
		emailReady: isEmailReady()
	})
})

// Public authentication routes.
app.use("/auth", authRoutes)

// User routes kept for backward compatibility.
app.use("/users", userRoutes)
app.use("/routes/users", userRoutes)

// Booking routes protected by JWT.
app.use("/bookings", bookingRoutes)


app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
