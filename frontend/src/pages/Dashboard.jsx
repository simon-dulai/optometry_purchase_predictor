import React from 'react'
import CSVUpload from '../components/CSVUpload'
import PatientTable from '../components/PatientTable'
import ForecastGraph from '../components/ForecastGraph'
import ClearDataButton from '../components/ClearDataButton'

const Dashboard = () => {
  return (
    <div className="container">
      <CSVUpload />

      <ForecastGraph />

      <PatientTable />

      <ClearDataButton />
    </div>
  )
}

export default Dashboard
