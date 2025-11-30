// src/pages/Dashboard.jsx
import React from 'react'
import CSVUpload from '../components/CSVUpload'
import PatientTable from '../components/PatientTable'
import ForecastGraph from '../components/ForecastGraph'
import DataSummary from '../components/DataSummary'
import ClearDataButton from '../components/ClearDataButton'

const Dashboard = () => {
  return (
    <div className="container">
      <CSVUpload />

      <DataSummary />

      <ForecastGraph />

      <PatientTable />

      <ClearDataButton />
    </div>
  )
}

export default Dashboard