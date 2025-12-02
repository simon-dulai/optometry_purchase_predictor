import React, { useState } from 'react'
import { api } from '../services/api'

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

      // Reload after successful upload
      setTimeout(() => {
        window.location.reload()
      }, 1500)
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.detail || 'Upload failed'
      })
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      {/* Demo CSV Downloads Section */}
      <div className="cyberpunk-card mb-2">
        <h3 className="cyberpunk-heading mb-2"> Demo CSV Files</h3>
        <p className="text-gray-300 mb-2">
          CSV files with realistic data centered
        </p>

        <div className="grid grid-2 mb-2">
          <div className="cyberpunk-card">
            <h4 className="cyberpunk-heading mb-1">📊 Past Appointments</h4>
            <p className="text-gray-400 text-sm mb-1">
              To test upload into 'Past Appointments' Below!
            </p>
            <a
              href={`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/demo/past-csv`}
              download
              className="cyberpunk-btn cyberpunk-btn-secondary block text-center"
            >
              ⬇️ Download Past CSV
            </a>
          </div>

          <div className="cyberpunk-card">
            <h4 className="cyberpunk-heading mb-1">📅 Upcoming Appointments</h4>
            <p className="text-gray-400 text-sm mb-1">
              To test upload into 'Upcoming Appointments' Below!
            </p>
            <a
              href={`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/demo/upcoming-csv`}
              download
              className="cyberpunk-btn block text-center"
            >
              ⬇️ Download Upcoming CSV
            </a>
          </div>
        </div>

      </div>

      {/* Upload Section */}
      <div className="cyberpunk-card">
        <h3 className="cyberpunk-heading mb-2">📤 Upload Your CSV Data</h3>

        {message.text && (
          <div className={`text-${message.type} mb-2`}>
            {message.text}
          </div>
        )}

        <div className="grid grid-2">
         <div className="cyberpunk-card">
            <h4 className="cyberpunk-heading mb-1">Past Appointments</h4>
            <input
              type="file"
              accept=".csv"
              onChange={(e) => handleFileUpload('past', e.target.files[0])}
              disabled={uploading}
              className="cyberpunk-input mb-1"
            />
          </div>

          <div className="cyberpunk-card">
            <h4 className="cyberpunk-heading mb-1">Upcoming Appointments</h4>
            <input
              type="file"
              accept=".csv"
              onChange={(e) => handleFileUpload('upcoming', e.target.files[0])}
              disabled={uploading}
              className="cyberpunk-input mb-1"
            />
          </div>
        </div>

        {uploading && <div className="cyberpunk-spinner"></div>}
      </div>
    </div>
  )
}


export default CSVUpload;