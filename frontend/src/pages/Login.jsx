// src/pages/Login.jsx
import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../services/api'

const Login = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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
      const response = await api.post('/login', formData)
      const { access_token } = response.data

      localStorage.setItem('token', access_token)

      // Get user data
      const userResponse = await api.get('/me')
      onLogin(userResponse.data)

    } catch (error) {
      setError(error.response?.data?.detail || 'Login failed')
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
          OptoCom
        </h1>
        <p className="text-center text-muted mb-2">Sales Prediction Analysis</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Username</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="cyberpunk-input"
              placeholder="Enter your username"
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
              placeholder="Enter your password"
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
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="text-center mt-2">
          <span className="text-muted">Don't have an account? </span>
          <Link to="/register" style={{ color: '#00ffff', textDecoration: 'none' }}>
            Register here
          </Link>
        </div>

        <div className="text-center mt-1">
            <a href="https://optometrypurchasepredictor-production.up.railway.app/predictor2.html" style={{ color: '#ff00ff', textDecoration: 'none', fontSize: '0.9rem' }}>
            Use Legacy Predictor
            </a>
        </div>
      </div>
    </div>
  )
}

export default Login
