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
      <div className="login-top-row">
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
          <div className="card-header">
            <h2>Instructions</h2>
            <p className="instructions-subtitle">How to book your appointment</p>
          </div>
          <ol className="instructions-list">
            <li>
              <span className="step-number">1</span>
              <span>Make a login.</span>
            </li>
            <li>
              <span className="step-number">2</span>
              <span>Choose <strong>New Booking</strong>.</span>
            </li>
            <li>
              <span className="step-number">3</span>
              <span>Check previous bookings on <strong>My Bookings</strong>.</span>
            </li>
            <li>
              <span className="step-number">4</span>
              <span>Delete a booking on <strong>My Bookings</strong> with <strong>Cancel</strong>.</span>
            </li>
          </ol>
        </aside>
      </div>

      <aside className="project-info">
        <div className="project-info-top">
          <h2>Project by Patricia Gea</h2>
          <div className="contact-links">
            <a href="https://github.com/PatriciaGea" target="_blank" rel="noreferrer">GitHub</a>
            <a href="https://www.linkedin.com/in/patriciageafrontend/" target="_blank" rel="noreferrer">LinkedIn</a>
            <a href="mailto:patricia.rodrigues@hyperisland.se">Email</a>
          </div>
        </div>

        <div className="project-info-grid">
          <div className="project-block">
            <h3>About</h3>
            <p>
              Full-stack booking system to create accounts, sign in, book slots, and manage appointments.
            </p>
          </div>

          <div className="project-block">
            <h3>Technologies</h3>
            <p>React, Vite, Node.js, Express, MongoDB, JWT, Google OAuth, Nodemailer.</p>
          </div>

          <div className="project-block">
            <h3>Highlights</h3>
            <ul>
              <li>JWT and Google sign-in</li>
              <li>Booking conflict prevention</li>
              <li>Responsive accessible UI</li>
              <li>Email confirmation</li>
            </ul>
          </div>
        </div>
      </aside>
    </div>
  )
}

export default Login
