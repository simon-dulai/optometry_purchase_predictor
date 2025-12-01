// src/pages/LegacyPredictor.jsx
import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../services/api'

const LegacyPredictor = () => {
  const [formData, setFormData] = useState({
    age: '',
    days_lps: '700',
    employed: false,
    benefits: false,
    driver: false,
    vdu: false,
    varifocal: false,
    high_rx: false
  })
  const [prediction, setPrediction] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setFormData({
      ...formData,
      [e.target.name]: value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setPrediction(null)

    try {
      const payload = {
        ...formData,
        age: parseInt(formData.age),
        days_lps: parseInt(formData.days_lps)
      }

      const response = await api.post('/predict', payload)
      setPrediction(response.data)
    } catch (error) {
      console.error('Prediction error:', error.response?.data)
      // Handle validation errors properly
      if (error.response?.data?.detail) {
        if (Array.isArray(error.response.data.detail)) {
          // Validation error array from FastAPI
          const errorMsg = error.response.data.detail.map(err => `${err.loc.join('.')}: ${err.msg}`).join('; ')
          setError(errorMsg)
        } else if (typeof error.response.data.detail === 'string') {
          setError(error.response.data.detail)
        } else {
          setError('Prediction failed. Please check your inputs.')
        }
      } else {
        setError('Prediction failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      padding: '20px',
      background: 'linear-gradient(45deg, #0a0a0a, #1a1a1a)'
    }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <h1 className="cyberpunk-font">Legacy Predictor</h1>
          <Link to="/login" className="cyberpunk-btn">
            Back to Login
          </Link>
        </div>

        <div className="cyberpunk-card">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-2">
              <div className="form-group">
                <label className="form-label">Age</label>
                <input
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleChange}
                  className="cyberpunk-input"
                  required
                  min="0"
                  max="120"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Days Since Last Purchase</label>
                <input
                  type="number"
                  name="days_lps"
                  value={formData.days_lps}
                  onChange={handleChange}
                  className="cyberpunk-input"
                  required
                  min="0"
                />
              </div>
            </div>

            <div className="grid grid-2">
              {['employed', 'benefits', 'driver', 'vdu', 'varifocal', 'high_rx'].map((field) => (
                <div key={field} className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input
                      type="checkbox"
                      name={field}
                      checked={formData[field]}
                      onChange={handleChange}
                      style={{ width: '20px', height: '20px' }}
                    />
                    <span className="form-label" style={{ margin: 0, textTransform: 'capitalize' }}>
                      {field.replace('_', ' ')}
                    </span>
                  </label>
                </div>
              ))}
            </div>

            <button
              type="submit"
              className="cyberpunk-btn"
              style={{ width: '100%' }}
              disabled={loading}
            >
              {loading ? 'Predicting...' : 'Predict'}
            </button>
          </form>

          {error && (
            <div className="cyberpunk-card mt-2" style={{ background: 'rgba(255, 0, 0, 0.1)', border: '1px solid #ff0000' }}>
              <div style={{ color: '#ff0000' }}>❌ {error}</div>
            </div>
          )}

          {prediction && (
            <div className="cyberpunk-card mt-2" style={{ background: 'rgba(0, 255, 255, 0.1)' }}>
              <h3 className="cyberpunk-heading text-center">Prediction Results</h3>
              <div className="grid grid-2 text-center">
                <div>
                  <div className="text-muted">Purchase Probability</div>
                  <div className="cyberpunk-font" style={{ fontSize: '1.5rem', color: '#00ffff' }}>
                    {prediction.purchase_probability_percent.toFixed(1)}%
                  </div>
                </div>
                <div>
                  <div className="text-muted">Predicted Spend</div>
                  <div className="cyberpunk-font" style={{ fontSize: '1.5rem', color: '#00ff00' }}>
                    £{prediction.predicted_spend.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default LegacyPredictor