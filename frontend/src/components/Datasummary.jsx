// originally used to display and assess overall data - invalid now
import React, { useState, useEffect } from 'react'
import { api } from '../services/api'
import { format, parseISO } from 'date-fns'

const DataSummary = () => {
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const fetchSummary = async () => {
    setLoading(true)
    try {

      const response = await api.get('/patients')
      const allPatients = response.data

      if (!allPatients || allPatients.length === 0) {
        setSummary(null)
        setLoading(false)
        return
      }


      const dateGroups = {}
      allPatients.forEach(patient => {
        const date = patient.appointment_date
        if (!dateGroups[date]) {
          dateGroups[date] = {
            count: 0,
            totalPredicted: 0,
            totalActual: 0,
            withActual: 0
          }
        }
        dateGroups[date].count++
        dateGroups[date].totalPredicted += patient.predicted_spend || 0
        if (patient.actual_spend && patient.actual_spend > 0) {
          dateGroups[date].totalActual += patient.actual_spend
          dateGroups[date].withActual++
        }
      })


      const sortedDates = Object.keys(dateGroups).sort()
      const earliestDate = sortedDates[0]
      const latestDate = sortedDates[sortedDates.length - 1]

      setSummary({
        totalPatients: allPatients.length,
        totalDates: sortedDates.length,
        earliestDate,
        latestDate,
        dateGroups,
        sortedDates
      })
    } catch (error) {
      console.error('Failed to fetch summary:', error)
      setSummary(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSummary()
  }, [])

  if (loading) {
    return (
      <div className="cyberpunk-card">
        <h3 className="cyberpunk-heading">Data Summary</h3>
        <div className="cyberpunk-spinner"></div>
      </div>
    )
  }

  if (!summary || summary.totalPatients === 0) {
    return (
      <div className="cyberpunk-card">
        <h3 className="cyberpunk-heading">Data Summary</h3>
        <div className="text-muted text-center" style={{ padding: '20px' }}>
          No patient data uploaded yet. Upload CSV files above to get started.
        </div>
      </div>
    )
  }

  const hasActualData = summary.sortedDates.some(date => summary.dateGroups[date].withActual > 0)

  return (
    <div className="cyberpunk-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 className="cyberpunk-heading">Data Summary</h3>
        <button
          className="cyberpunk-btn cyberpunk-btn-secondary"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? 'Show Less' : 'Show All Dates'}
        </button>
      </div>

      {/* Overview Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '15px',
        marginBottom: '20px'
      }}>
        <div className="cyberpunk-card" style={{ background: 'rgba(0, 255, 255, 0.1)' }}>
          <div className="text-muted" style={{ fontSize: '0.9rem' }}>Total Patients</div>
          <div style={{ fontSize: '1.5rem', color: '#00ffff', fontWeight: 'bold' }}>
            {summary.totalPatients}
          </div>
        </div>

        <div className="cyberpunk-card" style={{ background: 'rgba(0, 255, 255, 0.1)' }}>
          <div className="text-muted" style={{ fontSize: '0.9rem' }}>Total Dates</div>
          <div style={{ fontSize: '1.5rem', color: '#00ffff', fontWeight: 'bold' }}>
            {summary.totalDates}
          </div>
        </div>

        <div className="cyberpunk-card" style={{ background: 'rgba(0, 255, 255, 0.1)' }}>
          <div className="text-muted" style={{ fontSize: '0.9rem' }}>Date Range</div>
          <div style={{ fontSize: '1rem', color: '#00ffff', fontWeight: 'bold' }}>
            {format(parseISO(summary.earliestDate), 'MMM dd')} - {format(parseISO(summary.latestDate), 'MMM dd, yyyy')}
          </div>
        </div>

        <div className="cyberpunk-card" style={{ background: hasActualData ? 'rgba(255, 0, 255, 0.1)' : 'rgba(128, 128, 128, 0.1)' }}>
          <div className="text-muted" style={{ fontSize: '0.9rem' }}>Has Actual Sales</div>
          <div style={{ fontSize: '1.5rem', color: hasActualData ? '#ff00ff' : '#888', fontWeight: 'bold' }}>
            {hasActualData ? 'Yes ✓' : 'No'}
          </div>
        </div>
      </div>

      {/* Expanded Date List */}
      {expanded && (
        <div style={{ maxHeight: '400px', overflowY: 'auto', marginTop: '20px' }}>
          <table className="cyberpunk-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Patients</th>
                <th>Total Predicted</th>
                <th>Total Actual</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {summary.sortedDates.map(date => {
                const group = summary.dateGroups[date]
                const hasActual = group.withActual > 0
                return (
                  <tr key={date}>
                    <td>{format(parseISO(date), 'EEE, MMM dd, yyyy')}</td>
                    <td>{group.count}</td>
                    <td style={{ color: '#00ffff' }}>£{group.totalPredicted.toFixed(2)}</td>
                    <td style={{ color: hasActual ? '#ff00ff' : '#888' }}>
                      {hasActual ? `£${group.totalActual.toFixed(2)}` : '-'}
                    </td>
                    <td>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '0.85rem',
                        background: hasActual ? 'rgba(255, 0, 255, 0.2)' : 'rgba(0, 255, 255, 0.2)',
                        color: hasActual ? '#ff00ff' : '#00ffff'
                      }}>
                        {hasActual ? `Past (${group.withActual} sold)` : 'Upcoming'}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Quick Tip */}
      <div style={{
        marginTop: '15px',
        padding: '10px',
        background: 'rgba(255, 255, 0, 0.1)',
        borderLeft: '3px solid #ffff00',
        fontSize: '0.9rem',
        color: '#cccccc'
      }}>
        💡 <strong>Tip:</strong> Use the date picker in graphs and table to navigate to specific dates.
        {hasActualData && ' Past appointments with actual sales are shown in magenta.'}
      </div>
    </div>
  )
}

export default DataSummary