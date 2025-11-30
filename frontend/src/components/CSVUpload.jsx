// src/components/CSVUpload.jsx
import React, { useState } from 'react'
import { api } from '../services/api'
import CSVValidator from './CSVValidator'

const CSVUpload = () => {
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  const handleFileUpload = async (type, file) => {
    if (!file) return

    setUploading(true)
    setMessage({ type: '', text: '' })

    const formData = new FormData()
    formData.append('file', file)

    try {
      const endpoint = type === 'upcoming' ? '/upload/upcoming' : '/upload/past'
      const response = await api.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      setMessage({
        type: 'success',
        text: response.data.message
      })
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.detail || 'Upload failed'
      })
    } finally {
      setUploading(false)
    }
  }

  // Option 1: Download from backend endpoint (if you add the CSV files there)
  const downloadDemoCSVFromBackend = async (type) => {
    try {
      const endpoint = `/demo/csv/${type}`
      const response = await api.get(endpoint, { responseType: 'blob' })

      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `demo_${type}.csv`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Failed to download demo CSV'
      })
    }
  }

  // Option 2: Download from public folder (put CSVs in /public/demo/)
  const downloadDemoCSVFromPublic = (type) => {
    try {
      const link = document.createElement('a')
      link.href = `/demo/demo_${type}.csv`  // Files should be in /public/demo/
      link.setAttribute('download', `demo_${type}.csv`)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Failed to download demo CSV'
      })
    }
  }

  // Option 3: Download from external URL (if hosted on GitHub, Google Drive, etc)
  const downloadDemoCSVFromURL = async (type) => {
    try {
      // Replace these URLs with your actual hosted CSV URLs
      const urls = {
        upcoming: 'https://your-domain.com/demo_upcoming.csv',
        past: 'https://your-domain.com/demo_past.csv'
      }

      const response = await fetch(urls[type])
      const blob = await response.blob()

      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `demo_${type}.csv`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Failed to download demo CSV'
      })
    }
  }

  // Choose which download method to use
  const downloadDemoCSV = (type) => {
    // OPTION 1: If you add CSVs to your backend
    // downloadDemoCSVFromBackend(type)

    // OPTION 2: If you put CSVs in /public/demo/ folder (RECOMMENDED)
    downloadDemoCSVFromPublic(type)

    // OPTION 3: If you host CSVs externally
    // downloadDemoCSVFromURL(type)
  }

  return (
    <div className="cyberpunk-card">
      <h3 className="cyberpunk-heading mb-2">CSV Upload</h3>

      {message.text && (
        <div className={`text-${message.type} mb-2`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-2">
        <div className="cyberpunk-card">
          <h4 className="cyberpunk-heading mb-1">Upcoming Appointments</h4>
          <p className="text-muted" style={{ fontSize: '0.85rem', marginBottom: '10px' }}>
            Upload CSV with future appointment dates (no actual_spend column)
          </p>
          <CSVValidator
            type="upcoming"
            onValidCSV={(file) => handleFileUpload('upcoming', file)}
          />
          <button
            className="cyberpunk-btn"
            onClick={() => downloadDemoCSV('upcoming')}
            disabled={uploading}
            style={{ marginTop: '15px' }}
          >
            📥 Download Demo CSV (10k rows)
          </button>
        </div>

        <div className="cyberpunk-card">
          <h4 className="cyberpunk-heading mb-1">Past Appointments</h4>
          <p className="text-muted" style={{ fontSize: '0.85rem', marginBottom: '10px' }}>
            Upload CSV with historical dates (includes actual_spend column)
          </p>
          <CSVValidator
            type="past"
            onValidCSV={(file) => handleFileUpload('past', file)}
          />
          <button
            className="cyberpunk-btn cyberpunk-btn-secondary"
            onClick={() => downloadDemoCSV('past')}
            disabled={uploading}
            style={{ marginTop: '15px' }}
          >
            📥 Download Demo CSV (10k rows)
          </button>
        </div>
      </div>

      {uploading && <div className="cyberpunk-spinner"></div>}
    </div>
  )
}

export default CSVUpload