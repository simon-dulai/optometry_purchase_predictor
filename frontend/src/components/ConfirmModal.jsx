import React from 'react'

const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  confirmDisabled = false
}) => {
  if (!isOpen) return null

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3 className="cyberpunk-heading mb-2">{title}</h3>
        <p className="text-muted mb-2">{message}</p>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button
            className="cyberpunk-btn"
            onClick={onClose}
            disabled={confirmDisabled}
          >
            Cancel
          </button>
          <button
            className="cyberpunk-btn cyberpunk-btn-danger"
            onClick={onConfirm}
            disabled={confirmDisabled}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmModal