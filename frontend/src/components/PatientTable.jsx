// src/components/PatientTable.jsx
import React, { useState, useEffect } from 'react'
import { format, parseISO, addDays } from 'date-fns'
import { api } from '../services/api'

const PatientTable = () => {
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [patientsPerPage] = useState(20) // Show 20 patients per page

  const fetchPatients = async (date) => {
    setLoading(true)
    try {
      // Fetch upcoming appointments
      let upcoming = []
      try {
        const upcomingResponse = await api.get(`/patients/date/${date}`)
        upcoming = upcomingResponse.data.map(p => ({ ...p, source: 'upcoming' }))
      } catch (error) {
        console.log('No upcoming appointments for this date')
      }

      // Fetch past appointments
      let past = []
      try {
        const pastResponse = await api.get(`/past/date/${date}`)
        past = pastResponse.data.map(p => ({
          ...p,
          source: 'past',
          predicted_spend: 0, // Past records don't have predictions
          purchase_probability: 0
        }))
      } catch (error) {
        console.log('No past appointments for this date')
      }

      // Combine both
      setPatients([...upcoming, ...past])
      setCurrentPage(1) // Reset to first page when date changes
    } catch (error) {
      console.error('Failed to fetch patients:', error)
      setPatients([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPatients(selectedDate)
  }, [selectedDate])

  const getPatientRowClass = (predictedSpend) => {
    if (predictedSpend >= 150) return 'patient-row-high'
    if (predictedSpend >= 80) return 'patient-row-medium'
    return 'patient-row-low'
  }

  const formatProbability = (probability) => {
    return `${(probability * 100).toFixed(1)}%`
  }

  const handlePreviousDate = () => {
    const currentDate = parseISO(selectedDate)
    const previousDate = addDays(currentDate, -1)
    setSelectedDate(format(previousDate, 'yyyy-MM-dd'))
  }

  const handleNextDate = () => {
    const currentDate = parseISO(selectedDate)
    const nextDate = addDays(currentDate, 1)
    setSelectedDate(format(nextDate, 'yyyy-MM-dd'))
  }

  // Pagination logic
  const indexOfLastPatient = currentPage * patientsPerPage
  const indexOfFirstPatient = indexOfLastPatient - patientsPerPage
  const currentPatients = patients.slice(indexOfFirstPatient, indexOfLastPatient)
  const totalPages = Math.ceil(patients.length / patientsPerPage)

  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1))
  }

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages))
  }

  const goToPage = (pageNumber) => {
    setCurrentPage(pageNumber)
  }

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages = []
    const maxPagesToShow = 5

    let startPage = Math.max(1, currentPage - 2)
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1)

    if (endPage - startPage < maxPagesToShow - 1) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1)
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i)
    }

    return pages
  }

  return (
    <div className="cyberpunk-card">
      {/* Date Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 className="cyberpunk-heading">Patient Predictions</h3>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            className="cyberpunk-btn cyberpunk-btn-secondary"
            onClick={handlePreviousDate}
          >
            ← Prev Day
          </button>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="cyberpunk-input"
            style={{ width: '150px' }}
          />
          <button
            className="cyberpunk-btn cyberpunk-btn-secondary"
            onClick={handleNextDate}
          >
            Next Day →
          </button>
        </div>
      </div>

      {/* Patient Count */}
      {!loading && patients.length > 0 && (
        <div style={{ marginBottom: '15px', color: '#cccccc' }}>
          Showing {indexOfFirstPatient + 1}-{Math.min(indexOfLastPatient, patients.length)} of {patients.length} patients
        </div>
      )}

      {loading ? (
        <div className="cyberpunk-spinner"></div>
      ) : (
        <>
          <div style={{ overflowX: 'auto' }}>
            <table className="cyberpunk-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Age</th>
                  <th>Days LPS</th>
                  <th>Employed</th>
                  <th>Benefits</th>
                  <th>Driver</th>
                  <th>VDU</th>
                  <th>Varifocal</th>
                  <th>High RX</th>
                  <th>Predicted Spend</th>
                  <th>Actual Spend</th>
                  <th>Purchase Prob</th>
                </tr>
              </thead>
              <tbody>
                {currentPatients.map((patient) => (
                  <tr key={patient.id} className={getPatientRowClass(patient.predicted_spend)}>
                    <td>{patient.id}</td>
                    <td>{patient.age}</td>
                    <td>{patient.days_lps}</td>
                    <td>{patient.employed ? 'Y' : 'N'}</td>
                    <td>{patient.benefits ? 'Y' : 'N'}</td>
                    <td>{patient.driver ? 'Y' : 'N'}</td>
                    <td>{patient.vdu ? 'Y' : 'N'}</td>
                    <td>{patient.varifocal ? 'Y' : 'N'}</td>
                    <td>{patient.high_rx ? 'Y' : 'N'}</td>
                    <td>£{patient.predicted_spend.toFixed(2)}</td>
                    <td style={{ color: patient.amount_spent > 0 ? '#ff00ff' : '#888' }}>
                      {patient.amount_spent !== null && patient.amount_spent !== undefined
                        ? `£${patient.amount_spent.toFixed(2)}`
                        : '-'}
                    </td>
                    <td>{formatProbability(patient.purchase_probability)}</td>
                  </tr>
                ))}
                {patients.length === 0 && (
                  <tr>
                    <td colSpan="12" className="text-center text-muted">
                      No patients found for selected date
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '10px',
              marginTop: '20px',
              flexWrap: 'wrap'
            }}>
              <button
                className="cyberpunk-btn cyberpunk-btn-secondary"
                onClick={handlePreviousPage}
                disabled={currentPage === 1}
                style={{ opacity: currentPage === 1 ? 0.5 : 1 }}
              >
                ← Previous
              </button>

              <div style={{ display: 'flex', gap: '5px' }}>
                {currentPage > 3 && (
                  <>
                    <button
                      className="cyberpunk-btn cyberpunk-btn-secondary"
                      onClick={() => goToPage(1)}
                    >
                      1
                    </button>
                    {currentPage > 4 && <span style={{ color: '#888', padding: '0 5px' }}>...</span>}
                  </>
                )}

                {getPageNumbers().map(pageNumber => (
                  <button
                    key={pageNumber}
                    className={`cyberpunk-btn ${pageNumber === currentPage ? '' : 'cyberpunk-btn-secondary'}`}
                    onClick={() => goToPage(pageNumber)}
                    style={{
                      minWidth: '40px',
                      fontWeight: pageNumber === currentPage ? 'bold' : 'normal'
                    }}
                  >
                    {pageNumber}
                  </button>
                ))}

                {currentPage < totalPages - 2 && (
                  <>
                    {currentPage < totalPages - 3 && <span style={{ color: '#888', padding: '0 5px' }}>...</span>}
                    <button
                      className="cyberpunk-btn cyberpunk-btn-secondary"
                      onClick={() => goToPage(totalPages)}
                    >
                      {totalPages}
                    </button>
                  </>
                )}
              </div>

              <button
                className="cyberpunk-btn cyberpunk-btn-secondary"
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                style={{ opacity: currentPage === totalPages ? 0.5 : 1 }}
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default PatientTable