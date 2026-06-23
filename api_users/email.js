const nodemailer = require("nodemailer")

let transporter = null
let emailReady = false

function getEmailCredentials() {
  const user = process.env.EMAIL_USER?.trim()
  const pass = process.env.EMAIL_PASS?.replace(/\s/g, "")

  if (!user || !pass) {
    return null
  }

  return { user, pass }
}

function getTransportOptions() {
  const credentials = getEmailCredentials()
  if (!credentials) {
    return []
  }

  const auth = {
    user: credentials.user,
    pass: credentials.pass
  }

  return [
    { service: "gmail", auth },
    {
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth
    },
    {
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth,
      requireTLS: true
    }
  ]
}

function isEmailConfigured() {
  return Boolean(getEmailCredentials())
}

async function verifyEmailTransport() {
  emailReady = false
  transporter = null

  const options = getTransportOptions()
  if (options.length === 0) {
    console.warn("Email disabled: set EMAIL_USER and EMAIL_PASS on the server")
    return false
  }

  for (const option of options) {
    const candidate = nodemailer.createTransport(option)

    try {
      await candidate.verify()
      transporter = candidate
      emailReady = true
      console.log(
        "Email transport ready for:",
        getEmailCredentials().user,
        option.service ? "(gmail service)" : `(port ${option.port})`
      )
      return true
    } catch (error) {
      console.error(
        "Email transport attempt failed:",
        option.service || option.port,
        error.message
      )
    }
  }

  console.error("All Gmail transport attempts failed. Regenerate the Gmail App Password on Render.")
  return false
}

function isEmailReady() {
  return emailReady
}

async function sendBookingConfirmationEmail(userEmail, userName, booking) {
  if (!transporter || !emailReady) {
    const verified = await verifyEmailTransport()
    if (!verified) {
      throw new Error("Email transport is not ready")
    }
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
    from: getEmailCredentials().user,
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
