import { useEffect, useState } from 'react'
import './style.css'
import api from '../../services/api'

function Login({ authMessage, onLoginSuccess, onSwitchToRegister }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  function showMessage(text) {
    setMessage(text)
    setTimeout(() => setMessage(''), 3000)
  }

  useEffect(() => {
    if (authMessage) {
      showMessage(authMessage)
    }
  }, [authMessage])

  async function handleLogin(e) {
    e.preventDefault()
    
    if (!email || !password) {
      showMessage('Please fill in email and password')
      return
    }

    setIsLoading(true)
    try {
      const response = await api.post('/auth/login', {
        email,
        password
      })

      localStorage.setItem('token', response.data.token)
      localStorage.setItem('user', JSON.stringify(response.data.user))

      showMessage('Login successful!')
      
      setTimeout(() => {
        onLoginSuccess(response.data.user)
      }, 500)
      
    } catch (error) {
      console.error('Error during login:', error)
      const errorMsg = error.response?.data?.message || 'Login failed'
      showMessage(errorMsg)
    } finally {
      setIsLoading(false)
    }
  }

  function handleGoogleLogin() {
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3000'
    window.location.href = `${apiBase}/auth/google`
  }

  return (
    <div className="login-page">
      <div className="login-layout">
        <form onSubmit={handleLogin} className="login-card">
          <p className="eyebrow">Booking System</p>
          <h1>Sign In</h1>
          <p className="login-instruction">
            You need to log in first.
          </p>

          <label htmlFor="login-email">Email</label>
          <input
            id="login-email"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
            autoComplete="email"
          />

          <label htmlFor="login-password">Password</label>
          <input
            id="login-password"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            autoComplete="current-password"
          />

          <button type="submit" disabled={isLoading}>
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>

          <button
            type="button"
            className="google-btn"
            onClick={handleGoogleLogin}
            disabled={isLoading}
          >
            <span className="google-icon" aria-hidden="true">G</span>
            Sign in with Google
          </button>

          <button 
            type="button" 
            className="secondary-btn"
            onClick={onSwitchToRegister}
            disabled={isLoading}
          >
            No account yet? Create one
          </button>

          {message && <p className="message">{message}</p>}
        </form>

        <aside className="instructions-card">
          <h2>Instructions</h2>
          <p className="instructions-subtitle">How to book your appointment</p>
          <ol className="instructions-list">
            <li>Make a login.</li>
            <li>Choose <strong>New Booking</strong>.</li>
            <li>Check previous bookings on <strong>My Bookings</strong>.</li>
            <li>
              Delete a booking: on <strong>My Bookings</strong>, use the <strong>Cancel</strong> option.
            </li>
          </ol>
          <p className="instructions-note">
            <strong>Note:</strong> When you book, you receive a web confirmation message and an email
            confirmation. You also receive a notification if the booking is not possible because
            the selected time is too long for the service.
          </p>
        </aside>
      </div>

      <aside className="project-info">
        <h2>Project by Patricia Gea</h2>
        <p className="contact-title">Contact:</p>
        <div className="contact-links">
          <a href="https://github.com/PatriciaGea" target="_blank" rel="noreferrer">GitHub</a>
          <a href="https://www.linkedin.com/in/patriciageafrontend/" target="_blank" rel="noreferrer">LinkedIn</a>
          <a href="mailto:patricia.rodrigues@hyperisland.se">Email</a>
        </div>

        <div className="project-details">
          <h3>About This Project</h3>
          <p>
            A full-stack booking system where users can create accounts, sign in,
            book appointment slots, and manage their bookings.
          </p>

          <h3>Technologies</h3>
          <p>React, Vite, Node.js, Express, MongoDB, JWT, Google OAuth, Nodemailer.</p>

          <h3>Highlights</h3>
          <ul>
            <li>Secure authentication with JWT and Google sign-in</li>
            <li>Booking conflict prevention by date and time</li>
            <li>Responsive interface with accessible contrast</li>
            <li>Email confirmation after successful booking</li>
          </ul>
        </div>
      </aside>
    </div>
  )
}

export default Login
