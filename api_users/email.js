const nodemailer = require("nodemailer")

let transporter = null

function isEmailConfigured() {
  return Boolean(process.env.EMAIL_USER?.trim() && process.env.EMAIL_PASS?.trim())
}

function getTransporter() {
  if (!isEmailConfigured()) {
    return null
  }

  if (!transporter) {
    const emailUser = process.env.EMAIL_USER.trim()
    const emailPass = process.env.EMAIL_PASS.replace(/\s/g, "")

    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: emailUser,
        pass: emailPass
      },
      connectionTimeout: 15000,
      greetingTimeout: 15000,
      socketTimeout: 20000
    })
  }

  return transporter
}

async function verifyEmailTransport() {
  if (!isEmailConfigured()) {
    console.warn("Email disabled: set EMAIL_USER and EMAIL_PASS on the server")
    return false
  }

  try {
    await getTransporter().verify()
    console.log("Email transport ready for:", process.env.EMAIL_USER.trim())
    return true
  } catch (error) {
    console.error("Email transport verification failed:", error.message)
    return false
  }
}

async function sendBookingConfirmationEmail(userEmail, userName, booking) {
  const mailTransporter = getTransporter()
  if (!mailTransporter) {
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

  const senderEmail = process.env.EMAIL_USER.trim()

  await mailTransporter.sendMail({
    from: senderEmail,
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
  verifyEmailTransport,
  sendBookingConfirmationEmail
}
