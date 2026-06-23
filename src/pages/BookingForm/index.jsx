import { useState, useEffect } from 'react'
import './style.css'
import api from '../../services/api'

function BookingForm() {
  const [serviceSize, setServiceSize] = useState('small')
  const [bookingDate, setBookingDate] = useState('')
  const [bookingTime, setBookingTime] = useState('')
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [loadingHint, setLoadingHint] = useState('')
  const [occupiedTimes, setOccupiedTimes] = useState([])

  // Available slots from 08:00 to 18:00.
  const availableTimes = [
    '08:00', '09:00', '10:00', '11:00', '12:00', 
    '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'
  ]

  function showMessage(text) {
    setMessage(text)
    setTimeout(() => setMessage(''), 4000)
  }

  // Wake up the API on Render free tier before the user submits.
  useEffect(() => {
    api.get('/health').catch(() => {})
  }, [])

  // Load occupied time slots when date changes.
  useEffect(() => {
    if (bookingDate) {
      loadOccupiedTimes(bookingDate)
    } else {
      setOccupiedTimes([])
    }
  }, [bookingDate])

  // Fetch existing bookings for selected date.
  async function loadOccupiedTimes(date) {
    try {
      const token = localStorage.getItem('token')
      const response = await api.get(`/bookings?date=${date}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      
      const times = response.data.map(booking => booking.bookingTime)
      setOccupiedTimes(times)
      
    } catch (error) {
      console.error('Error loading occupied times:', error)
    }
  }

  async function handleCreateBooking(e) {
    e.preventDefault()
    
    if (!serviceSize || !bookingDate || !bookingTime) {
      showMessage('Please fill in all fields')
      return
    }

    if (occupiedTimes.includes(bookingTime)) {
      showMessage('This slot is already occupied. Please pick another one.')
      return
    }

    setIsLoading(true)
    setLoadingHint('Saving your booking...')
    const slowHintTimer = setTimeout(() => {
      setLoadingHint('Server is waking up, please wait...')
    }, 4000)

    try {
      const token = localStorage.getItem('token')
      
      const response = await api.post('/bookings', {
        serviceSize,
        bookingDate,
        bookingTime
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      const successMessage = response.data.emailSent
        ? 'Booking created successfully! Confirmation email sent.'
        : 'Booking created successfully!'

      showMessage(successMessage)
      
      setServiceSize('small')
      setBookingDate('')
      setBookingTime('')
      setOccupiedTimes([])
      
    } catch (error) {
      console.error('Error creating booking:', error)
      let errorMsg = error.response?.data?.message || 'Error creating booking'

      if (error.code === 'ECONNABORTED') {
        errorMsg = 'Request timed out. The server may be waking up — try again in a few seconds.'
      } else if (!error.response) {
        errorMsg = 'Could not reach the server. Check your connection and try again.'
      }

      showMessage(errorMsg)
    } finally {
      clearTimeout(slowHintTimer)
      setLoadingHint('')
      setIsLoading(false)
    }
  }

  // Minimum date allowed is today.
  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="booking-container">
      <form onSubmit={handleCreateBooking}>
        <h2>New Booking</h2>

        <div className="form-group">
          <label>Service Size:</label>
          <select 
            value={serviceSize} 
            onChange={(e) => setServiceSize(e.target.value)}
            disabled={isLoading}
          >
            <option value="small">Small</option>
            <option value="medium">Medium</option>
            <option value="large">Large</option>
          </select>
        </div>

        <div className="form-group">
          <label>Date:</label>
          <input
            type="date"
            value={bookingDate}
            min={today}
            onChange={(e) => setBookingDate(e.target.value)}
            disabled={isLoading}
          />
        </div>

        <div className="form-group">
          <label>Time:</label>
          <select 
            value={bookingTime} 
            onChange={(e) => setBookingTime(e.target.value)}
            disabled={isLoading || !bookingDate}
          >
            <option value="">Select a time</option>
            {availableTimes.map(time => (
              <option 
                key={time} 
                value={time}
                disabled={occupiedTimes.includes(time)}
              >
                {time} {occupiedTimes.includes(time) ? '(Occupied)' : ''}
              </option>
            ))}
          </select>
        </div>

        {bookingDate && occupiedTimes.length > 0 && (
          <div className="info-box">
            <p>Occupied time slots on this date: {occupiedTimes.join(', ')}</p>
          </div>
        )}

        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Booking...' : 'Book Now'}
        </button>

        {isLoading && loadingHint && (
          <p className="loading-hint">{loadingHint}</p>
        )}

        {message && <p className="message">{message}</p>}
      </form>
    </div>
  )
}

export default BookingForm
