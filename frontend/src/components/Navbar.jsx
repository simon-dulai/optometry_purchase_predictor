import React from 'react'

const Navbar = ({ user, onLogout }) => {
  return (
    <nav className="navbar">
      <div className="navbar-brand">
        OptoCom
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <span className="text-muted">Welcome, {user?.practice_name || user?.username}</span>
        <button
          className="cyberpunk-btn cyberpunk-btn-secondary"
          onClick={onLogout}
        >
          Logout
        </button>
      </div>
    </nav>
  )
}

export default Navbar
