const dns = require("node:dns").promises
dns.setServers(["1.1.1.1"])
const express = require("express")
const router = express.Router()
const Booking = require("../models/booking")
const User = require("../models/user")
const authMiddleware = require("../middleware/auth")
const { sendBookingConfirmationEmail } = require("../email")

const OPENING_HOUR_IN_MINUTES = 8 * 60
const CLOSING_HOUR_IN_MINUTES = 18 * 60
const SERVICE_DURATION_IN_MINUTES = {
  small: 60,
  medium: 120,
  large: 180
}

function parseTimeToMinutes(time) {
  const [hours, minutes] = String(time).split(":").map(Number)
  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) {
    return null
  }

  return (hours * 60) + minutes
}

// POST /bookings - Create new booking (protected route)
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { bookingDate, bookingTime } = req.body
    const userId = req.userId

    const normalizedServiceSize = {
      pequeno: "small",
      medio: "medium",
      grande: "large",
      small: "small",
      medium: "medium",
      large: "large"
    }[req.body.serviceSize]

    // Validate required fields.
    if (!normalizedServiceSize || !bookingDate || !bookingTime) {
      return res.status(400).json({ message: "All fields are required" })
    }

    const bookingStartMinutes = parseTimeToMinutes(bookingTime)
    if (bookingStartMinutes === null) {
      return res.status(400).json({ message: "Invalid booking time format" })
    }

    const serviceDuration = SERVICE_DURATION_IN_MINUTES[normalizedServiceSize]
    const bookingEndMinutes = bookingStartMinutes + serviceDuration

    if (
      bookingStartMinutes < OPENING_HOUR_IN_MINUTES ||
      bookingEndMinutes > CLOSING_HOUR_IN_MINUTES
    ) {
      return res.status(400).json({
        message: "This service is too long for the selected time and exceeds available booking hours"
      })
    }

    // Check schedule conflict for same date/time.
    const conflict = await Booking.findOne({ bookingDate, bookingTime })
    if (conflict) {
      return res.status(409).json({ 
        message: "This time slot is already occupied. Please choose another." 
      })
    }

    // Create booking.
    const booking = new Booking({
      userId,
      serviceSize: normalizedServiceSize,
      bookingDate,
      bookingTime
    })
    await booking.save()

    const user = await User.findById(userId)
    let emailSent = false

    if (user?.email) {
      try {
        await sendBookingConfirmationEmail(user.email, user.name, booking)
        emailSent = true
      } catch (error) {
        console.error("Error sending confirmation email:", error)
      }
    }

    res.status(201).json({
      message: "Booking created successfully",
      booking,
      emailSent
    })
  } catch (error) {
    console.error("Error creating booking:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// GET /bookings - Return bookings for logged user or selected date.
router.get("/", authMiddleware, async (req, res) => {
  try {
    const userId = req.userId
    const { date } = req.query

    let filter = {}

    // Filter by date when provided.
    if (date) {
      filter.bookingDate = date
    } else {
      filter.userId = userId
    }

    const bookings = await Booking.find(filter)
      .populate("userId", "name email")
      .sort({ bookingDate: 1, bookingTime: 1 })

    res.status(200).json(bookings)
  } catch (error) {
    console.error("Error loading bookings:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// GET /bookings/my - Return only logged user bookings.
router.get("/my", authMiddleware, async (req, res) => {
  try {
    const userId = req.userId

    const bookings = await Booking.find({ userId })
      .sort({ bookingDate: 1, bookingTime: 1 })

    res.status(200).json(bookings)
  } catch (error) {
    console.error("Error loading bookings:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// DELETE /bookings/:id - Cancel booking.
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const userId = req.userId
    const bookingId = req.params.id

    // Verify ownership before deleting.
    const booking = await Booking.findOne({ _id: bookingId, userId })
    
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" })
    }

    await Booking.findByIdAndDelete(bookingId)
    
    res.status(200).json({ message: "Booking cancelled successfully" })
  } catch (error) {
    console.error("Error cancelling booking:", error)
    res.status(500).json({ message: "Server error" })
  }
})

module.exports = router
