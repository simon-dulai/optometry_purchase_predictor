// src/pages/Register.jsx
import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../services/api'

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    practice_name: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const navigate = useNavigate()

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      await api.post('/register', formData)
      navigate('/login', { state: { message: 'Registration successful! Please login.' } })
    } catch (error) {
      setError(error.response?.data?.detail || 'Registration failed')
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(45deg, #0a0a0a, #1a1a1a)'
    }}>
      <div className="cyberpunk-card" style={{ width: '100%', maxWidth: '400px', margin: '20px' }}>
        <h1 className="cyberpunk-font text-center mb-2" style={{ fontSize: '2rem' }}>
          Register
        </h1>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Username</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="cyberpunk-input"
              placeholder="Choose a username"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="cyberpunk-input"
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Practice Name</label>
            <input
              type="text"
              name="practice_name"
              value={formData.practice_name}
              onChange={handleChange}
              className="cyberpunk-input"
              placeholder="Your practice name"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="cyberpunk-input"
              placeholder="Choose a password"
              required
            />
          </div>

          {error && (
            <div className="text-error mb-2">{error}</div>
          )}

          <button
            type="submit"
            className="cyberpunk-btn"
            style={{ width: '100%' }}
            disabled={loading}
          >
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>

        <div className="text-center mt-2">
          <span className="text-muted">Already have an account? </span>
          <Link to="/login" style={{ color: '#00ffff', textDecoration: 'none' }}>
            Login here
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Register