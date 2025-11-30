// src/components/ForecastGraph.jsx
import React, { useState, useEffect } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Line, Bar } from 'react-chartjs-2'
import {
  format,
  addDays,
  addMonths,
  startOfWeek,
  startOfMonth,
  getDaysInMonth,
  parseISO,
  eachDayOfInterval,
  endOfMonth
} from 'date-fns'
import { api } from '../services/api'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
)

const ForecastGraph = () => {
  const [viewMode, setViewMode] = useState('weekly')
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [graphData, setGraphData] = useState({})
  const [loading, setLoading] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    try {
      let dates = []

      switch (viewMode) {
        case 'daily':
          dates = [selectedDate]
          break

        case 'weekly':
          const weekStart = startOfWeek(parseISO(selectedDate), { weekStartsOn: 1 })
          dates = eachDayOfInterval({
            start: weekStart,
            end: addDays(weekStart, 6)
          }).map(d => format(d, 'yyyy-MM-dd'))
          break

        case 'monthly':
          const monthStart = startOfMonth(parseISO(selectedDate))
          const monthEnd = endOfMonth(parseISO(selectedDate))
          dates = eachDayOfInterval({
            start: monthStart,
            end: monthEnd
          }).map(d => format(d, 'yyyy-MM-dd'))
          break

        default:
          break
      }

      const dataMap = {}

      console.log('🔍 Fetching data for dates:', dates)

      await Promise.all(
        dates.map(async (date) => {
          try {
            // Fetch upcoming appointments (Patient table)
            let upcomingPatients = []
            try {
              const upcomingResponse = await api.get(`/patients/date/${date}`)
              upcomingPatients = upcomingResponse.data
              console.log(`✅ Upcoming for ${date}:`, upcomingPatients.length, 'patients')
            } catch (err) {
              console.log(`⚠️ No upcoming appointments for ${date}:`, err.message)
            }

            // Fetch past appointments (Past table)
            let pastPatients = []
            try {
              const pastResponse = await api.get(`/past/date/${date}`)
              pastPatients = pastResponse.data
              console.log(`✅ Past for ${date}:`, pastPatients.length, 'records', pastPatients)
            } catch (err) {
              console.log(`⚠️ No past appointments for ${date}:`, err.message)
            }

            // Combine both
           const allPatients = [...upcomingPatients, ...pastPatients];

           const totalPredicted =
                upcomingPatients.reduce((sum, p) => sum + (p.predicted_spend || 0), 0) +
                pastPatients.reduce((sum, p) => sum + (p.predicted_spend || 0), 0);

           const totalActual =
                pastPatients.reduce((sum, p) => sum + (p.amount_spent || 0), 0);

            // Debug logging
            if (allPatients.length > 0) {
              console.log(`Date ${date}:`, {
                upcoming: upcomingPatients.length,
                past: pastPatients.length,
                total: allPatients.length,
                predicted: `£${totalPredicted.toFixed(2)}`,
                actual: `£${totalActual.toFixed(2)}`,
                sampleUpcoming: upcomingPatients[0],
                samplePast: pastPatients[0]
              })
            }

            dataMap[date] = {
              total_predicted: totalPredicted,
              total_actual: totalActual,
              count: allPatients.length
            }
          } catch (error) {
            dataMap[date] = {
              total_predicted: 0,
              total_actual: 0,
              count: 0
            }
          }
        })
      )

      setGraphData(dataMap)
    } catch (error) {
      console.error('Failed to fetch data:', error)
      setGraphData({})
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [viewMode, selectedDate])

  const hasActualData = () => {
    return Object.values(graphData).some(d => d.total_actual && d.total_actual > 0)
  }

  const generateChartData = () => {
    let labels = []
    let predictedData = []
    let actualData = []

    switch (viewMode) {
      case 'daily':
        const dayData = graphData[selectedDate] || { total_predicted: 0, total_actual: 0 }
        return {
          labels: ['Predicted', 'Actual'],
          predictedData: [dayData.total_predicted || 0],
          actualData: [dayData.total_actual || 0]
        }

      case 'weekly':
        const weekStart = startOfWeek(parseISO(selectedDate), { weekStartsOn: 1 })

        for (let i = 0; i < 7; i++) {
          const day = addDays(weekStart, i)
          const dayStr = format(day, 'yyyy-MM-dd')
          labels.push(`${format(day, 'EEE')}\n${format(day, 'MMM dd')}`)

          const dayData = graphData[dayStr] || { total_predicted: 0, total_actual: 0 }
          predictedData.push(dayData.total_predicted || 0)
          actualData.push(dayData.total_actual || 0)
        }
        break

      case 'monthly':
        const monthStart = startOfMonth(parseISO(selectedDate))
        const daysInMonth = getDaysInMonth(monthStart)

        for (let i = 0; i < daysInMonth; i++) {
          const day = addDays(monthStart, i)
          const dayStr = format(day, 'yyyy-MM-dd')
          labels.push(format(day, 'dd'))

          const dayData = graphData[dayStr] || { total_predicted: 0, total_actual: 0 }
          predictedData.push(dayData.total_predicted || 0)
          actualData.push(dayData.total_actual || 0)
        }
        break
    }

    return { labels, predictedData, actualData }
  }

  const handlePrevious = () => {
    const current = parseISO(selectedDate)
    let newDate

    switch (viewMode) {
      case 'daily':
        newDate = addDays(current, -1)
        break
      case 'weekly':
        newDate = addDays(current, -7)
        break
      case 'monthly':
        newDate = addMonths(current, -1)
        break
      default:
        newDate = current
    }

    setSelectedDate(format(newDate, 'yyyy-MM-dd'))
  }

  const handleNext = () => {
    const current = parseISO(selectedDate)
    let newDate

    switch (viewMode) {
      case 'daily':
        newDate = addDays(current, 1)
        break
      case 'weekly':
        newDate = addDays(current, 7)
        break
      case 'monthly':
        newDate = addMonths(current, 1)
        break
      default:
        newDate = current
    }

    setSelectedDate(format(newDate, 'yyyy-MM-dd'))
  }

  const getDateInputType = () => {
    return viewMode === 'monthly' ? 'month' : 'date'
  }

  const getDateInputValue = () => {
    return viewMode === 'monthly' ? format(parseISO(selectedDate), 'yyyy-MM') : selectedDate
  }

  const handleDateChange = (e) => {
    const value = e.target.value
    setSelectedDate(viewMode === 'monthly' ? `${value}-01` : value)
  }

  const getTitle = () => {
    switch (viewMode) {
      case 'weekly':
        return `Weekly View - Week of ${format(startOfWeek(parseISO(selectedDate), { weekStartsOn: 1 }), 'MMM dd, yyyy')}`
      case 'monthly':
        return `Monthly View - ${format(parseISO(selectedDate), 'MMMM yyyy')}`
      case 'daily':
        return `Daily View - ${format(parseISO(selectedDate), 'EEEE, MMMM dd, yyyy')}`
      default:
        return 'Sales Forecast'
    }
  }

  const { labels, predictedData, actualData } = generateChartData()
  const showActualLine = hasActualData()

  if (viewMode === 'daily') {
    const chartData = {
      labels: ['Sales'],
      datasets: [
        {
          label: 'Predicted',
          data: predictedData,
          backgroundColor: 'rgba(0, 255, 255, 0.8)',
          borderColor: '#00ffff',
          borderWidth: 2,
          borderRadius: 4,
        },
        {
          label: 'Actual',
          data: actualData,
          backgroundColor: 'rgba(255, 0, 255, 0.8)',
          borderColor: '#ff00ff',
          borderWidth: 2,
          borderRadius: 4,
        }
      ]
    }

    const chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: {
            color: '#ffffff',
            font: { family: 'Rajdhani', size: 14 },
          },
        },
        title: {
          display: true,
          text: getTitle(),
          color: '#ffffff',
          font: { family: 'Rajdhani', size: 18, weight: 'bold' },
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return `${context.dataset.label}: £${context.parsed.y.toFixed(2)}`
            }
          }
        }
      },
      scales: {
        x: {
          grid: { color: 'rgba(0, 255, 255, 0.1)' },
          ticks: { color: '#cccccc', font: { family: 'Inter' } },
        },
        y: {
          grid: { color: 'rgba(0, 255, 255, 0.1)' },
          ticks: {
            color: '#cccccc',
            font: { family: 'Inter' },
            callback: function(value) { return '£' + value },
          },
        },
      },
    }

    const dayData = graphData[selectedDate] || { total_predicted: 0, total_actual: 0 }
    const variance = (dayData.total_actual || 0) - (dayData.total_predicted || 0)

    return (
      <div className="cyberpunk-card">
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button className={`cyberpunk-btn ${viewMode === 'daily' ? '' : 'cyberpunk-btn-secondary'}`} onClick={() => setViewMode('daily')}>Daily</button>
            <button className={`cyberpunk-btn ${viewMode === 'weekly' ? '' : 'cyberpunk-btn-secondary'}`} onClick={() => setViewMode('weekly')}>Weekly</button>
            <button className={`cyberpunk-btn ${viewMode === 'monthly' ? '' : 'cyberpunk-btn-secondary'}`} onClick={() => setViewMode('monthly')}>Monthly</button>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 className="cyberpunk-heading">Sales Analytics</h3>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button className="cyberpunk-btn cyberpunk-btn-secondary" onClick={handlePrevious}>← Prev</button>
            <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="cyberpunk-input" style={{ width: '150px' }} />
            <button className="cyberpunk-btn cyberpunk-btn-secondary" onClick={handleNext}>Next →</button>
          </div>
        </div>

        {loading ? (
          <div className="cyberpunk-spinner"></div>
        ) : (
          <>
            <div style={{ height: '400px' }}>
              <Bar data={chartData} options={chartOptions} />
            </div>

            <div style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', textAlign: 'center' }}>
              <div>
                <div className="text-muted" style={{ fontSize: '0.9rem' }}>Predicted</div>
                <div style={{ fontSize: '1.3rem', color: '#00ffff', fontWeight: 'bold' }}>£{(dayData.total_predicted || 0).toFixed(2)}</div>
              </div>
              <div>
                <div className="text-muted" style={{ fontSize: '0.9rem' }}>Actual</div>
                <div style={{ fontSize: '1.3rem', color: '#ff00ff', fontWeight: 'bold' }}>£{(dayData.total_actual || 0).toFixed(2)}</div>
              </div>
              <div>
                <div className="text-muted" style={{ fontSize: '0.9rem' }}>Variance</div>
                <div className={`text-${variance >= 0 ? 'success' : 'error'}`} style={{ fontSize: '1.3rem', fontWeight: 'bold' }}>
                  {variance >= 0 ? '+' : ''}£{variance.toFixed(2)}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    )
  }

  const datasets = [
    {
      label: 'Predicted Sales',
      data: predictedData,
      borderColor: '#00ffff',
      backgroundColor: 'rgba(0, 255, 255, 0.1)',
      borderWidth: 3,
      pointBackgroundColor: '#00ffff',
      pointBorderColor: '#000000',
      pointBorderWidth: 2,
      pointRadius: viewMode === 'monthly' ? 3 : 6,
      tension: 0.4,
    }
  ]

  if (showActualLine) {
    datasets.push({
      label: 'Actual Sales',
      data: actualData,
      borderColor: '#ff00ff',
      backgroundColor: 'rgba(255, 0, 255, 0.1)',
      borderWidth: 3,
      pointBackgroundColor: '#ff00ff',
      pointBorderColor: '#000000',
      pointBorderWidth: 2,
      pointRadius: viewMode === 'monthly' ? 3 : 6,
      tension: 0.4,
    })
  }

  const chartData = { labels, datasets }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: { color: '#ffffff', font: { family: 'Rajdhani', size: 14 } },
      },
      title: {
        display: true,
        text: getTitle(),
        color: '#ffffff',
        font: { family: 'Rajdhani', size: 18, weight: 'bold' },
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: £${context.parsed.y.toFixed(2)}`
          }
        }
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(0, 255, 255, 0.1)' },
        ticks: {
          color: '#cccccc',
          font: { family: 'Inter', size: viewMode === 'monthly' ? 10 : 11 },
          maxRotation: 0,
          autoSkip: viewMode === 'monthly',
          maxTicksLimit: viewMode === 'monthly' ? 15 : undefined,
        },
      },
      y: {
        grid: { color: 'rgba(0, 255, 255, 0.1)' },
        ticks: {
          color: '#cccccc',
          font: { family: 'Inter' },
          callback: function(value) { return '£' + value },
        },
      },
    },
  }

  const calculateStats = () => {
    const totalPredicted = predictedData.reduce((sum, val) => sum + val, 0)
    const totalActual = actualData.reduce((sum, val) => sum + val, 0)
    const variance = totalActual - totalPredicted
    return { totalPredicted, totalActual, variance }
  }

  const stats = calculateStats()

  return (
    <div className="cyberpunk-card">
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button className={`cyberpunk-btn ${viewMode === 'daily' ? '' : 'cyberpunk-btn-secondary'}`} onClick={() => setViewMode('daily')}>Daily</button>
          <button className={`cyberpunk-btn ${viewMode === 'weekly' ? '' : 'cyberpunk-btn-secondary'}`} onClick={() => setViewMode('weekly')}>Weekly</button>
          <button className={`cyberpunk-btn ${viewMode === 'monthly' ? '' : 'cyberpunk-btn-secondary'}`} onClick={() => setViewMode('monthly')}>Monthly</button>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 className="cyberpunk-heading">Sales Analytics</h3>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button className="cyberpunk-btn cyberpunk-btn-secondary" onClick={handlePrevious}>← Prev</button>
          <input type={getDateInputType()} value={getDateInputValue()} onChange={handleDateChange} className="cyberpunk-input" style={{ width: '150px' }} />
          <button className="cyberpunk-btn cyberpunk-btn-secondary" onClick={handleNext}>Next →</button>
        </div>
      </div>

      {loading ? (
        <div className="cyberpunk-spinner"></div>
      ) : Object.keys(graphData).length > 0 ? (
        <>
          <div style={{ height: '400px' }}>
            <Line data={chartData} options={chartOptions} />
          </div>

          <div style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: showActualLine ? 'repeat(3, 1fr)' : 'repeat(1, 1fr)', gap: '15px', textAlign: 'center' }}>
            <div>
              <div className="text-muted" style={{ fontSize: '0.9rem' }}>Total Predicted</div>
              <div style={{ fontSize: '1.3rem', color: '#00ffff', fontWeight: 'bold' }}>£{stats.totalPredicted.toFixed(2)}</div>
            </div>
            {showActualLine && (
              <>
                <div>
                  <div className="text-muted" style={{ fontSize: '0.9rem' }}>Total Actual</div>
                  <div style={{ fontSize: '1.3rem', color: '#ff00ff', fontWeight: 'bold' }}>£{stats.totalActual.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-muted" style={{ fontSize: '0.9rem' }}>Variance</div>
                  <div className={`text-${stats.variance >= 0 ? 'success' : 'error'}`} style={{ fontSize: '1.3rem', fontWeight: 'bold' }}>
                    {stats.variance >= 0 ? '+' : ''}£{stats.variance.toFixed(2)}
                  </div>
                </div>
              </>
            )}
          </div>
        </>
      ) : (
        <div className="text-center text-muted">No data available for selected period</div>
      )}
    </div>
  )
}

export default ForecastGraph