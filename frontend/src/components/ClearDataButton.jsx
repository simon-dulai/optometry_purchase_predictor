// src/components/ClearDataButton.jsx
import React, { useState } from 'react'
import { api } from '../services/api'
import ConfirmModal from './ConfirmModal'

const ClearDataButton = () => {
  const [showModal, setShowModal] = useState(false)
  const [clearing, setClearing] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  const handleClearData = async () => {
    setClearing(true)
    try {
      const response = await api.delete('/data/clear')
      setMessage({
        type: 'success',
        text: response.data.message
      })
      setShowModal(false)
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.detail || 'Failed to clear data'
      })
    } finally {
      setClearing(false)
    }
  }

  return (
    <>
      <div className="cyberpunk-card">
        <h3 className="cyberpunk-heading mb-2">Data Management</h3>

        {message.text && (
          <div className={`text-${message.type} mb-2`}>
            {message.text}
          </div>
        )}

        <button
          className="cyberpunk-btn cyberpunk-btn-danger"
          onClick={() => setShowModal(true)}
          disabled={clearing}
        >
          {clearing ? 'Clearing...' : 'Clear All My Data'}
        </button>
      </div>

      <ConfirmModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={handleClearData}
        title="Clear All Data"
        message="Are you sure? This will delete all your patients, predictions, and past appointment data. This cannot be undone."
        confirmText={clearing ? "Clearing..." : "Yes, Clear Everything"}
        confirmDisabled={clearing}
      />
    </>
  )
}

export default ClearDataButton