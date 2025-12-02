// to test if react working
import React from 'react'

const Test = () => {
  return (
    <div style={{
      padding: '20px',
      color: '#00ffff',
      background: '#1a1a1a',
      minHeight: '100vh'
    }}>
      <h1>Test Component - If you see this, React is working</h1>
      <p>Dashboard content would go here</p>
      <button onClick={() => console.log('Test button clicked')}>
        Test Button
      </button>
    </div>
  )
}

export default Test