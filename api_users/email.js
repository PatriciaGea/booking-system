const nodemailer = require("nodemailer")

let emailReady = false

const transporter =
  process.env.EMAIL_USER && process.env.EMAIL_PASS
    ? nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      })
    : null

function isEmailConfigured() {
  return Boolean(transporter)
}

async function verifyEmailTransport() {
  if (!transporter) {
    console.warn("Email disabled: set EMAIL_USER and EMAIL_PASS on the server")
    emailReady = false
    return false
  }

  try {
    await transporter.verify()
    emailReady = true
    console.log("Email transport ready for:", process.env.EMAIL_USER)
    return true
  } catch (error) {
    emailReady = false
    console.error("Email transport verification failed:", error)
    return false
  }
}

function isEmailReady() {
  return emailReady
}

async function sendBookingConfirmationEmail(userEmail, userName, booking) {
  if (!transporter) {
    throw new Error("Email is not configured on the server")
  }

  const serviceSizeLabel = {
    pequeno: "Small",
    medio: "Medium",
    grande: "Large",
    small: "Small",
    medium: "Medium",
    large: "Large"
  }[booking.serviceSize] || booking.serviceSize

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: userEmail,
    subject: "Booking Confirmation",
    html: `
      <h2>Hello ${userName}!</h2>
      <p>Your booking has been confirmed successfully.</p>
      <p><strong>Date:</strong> ${booking.bookingDate}</p>
      <p><strong>Time:</strong> ${booking.bookingTime}</p>
      <p><strong>Service:</strong> ${serviceSizeLabel}</p>
      <br>
      <p>Thank you for booking with us.</p>
    `
  })

  console.log("Confirmation email sent to:", userEmail)
}

module.exports = {
  isEmailConfigured,
  isEmailReady,
  verifyEmailTransport,
  sendBookingConfirmationEmail
}
