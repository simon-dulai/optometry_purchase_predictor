// src/components/WeeklyGraph.jsx
import React, { useState, useEffect } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import { format, addWeeks, parseISO } from 'date-fns'
import { api } from '../services/api'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

const WeeklyGraph = () => {
  const [weeklyData, setWeeklyData] = useState([])
  const [loading, setLoading] = useState(false)

  const fetchWeeklyData = async () => {
    setLoading(true)
    try {
      const startDate = format(new Date(), 'yyyy-MM-dd')
      const response = await api.get(`/analytics/weekly?start_date=${startDate}`)
      setWeeklyData(response.data)
    } catch (error) {
      console.error('Failed to fetch weekly data:', error)
      setWeeklyData([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWeeklyData()
  }, [])

  const chartData = {
    labels: weeklyData.map(week => format(parseISO(week.date), 'MMM dd')),
    datasets: [
      {
        label: 'Predicted Sales',
        data: weeklyData.map(week => week.total_predicted),
        borderColor: '#00ffff',
        backgroundColor: 'rgba(0, 255, 255, 0.1)',
        borderWidth: 3,
        pointBackgroundColor: '#00ffff',
        pointBorderColor: '#000000',
        pointBorderWidth: 2,
        pointRadius: 6,
        tension: 0.4,
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#ffffff',
          font: {
            family: 'Rajdhani',
            size: 14,
          },
        },
      },
      title: {
        display: true,
        text: '4-Week Sales Forecast',
        color: '#ffffff',
        font: {
          family: 'Rajdhani',
          size: 18,
          weight: 'bold',
        },
      },
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(0, 255, 255, 0.1)',
        },
        ticks: {
          color: '#cccccc',
          font: {
            family: 'Inter',
          },
        },
      },
      y: {
        grid: {
          color: 'rgba(0, 255, 255, 0.1)',
        },
        ticks: {
          color: '#cccccc',
          font: {
            family: 'Inter',
          },
          callback: function(value) {
            return '£' + value
          },
        },
      },
    },
  }

  return (
    <div className="cyberpunk-card">
      <h3 className="cyberpunk-heading mb-2">Weekly Forecast</h3>
      {loading ? (
        <div className="cyberpunk-spinner"></div>
      ) : weeklyData.length > 0 ? (
        <div style={{ height: '300px' }}>
          <Line data={chartData} options={chartOptions} />
        </div>
      ) : (
        <div className="text-center text-muted">No weekly data available</div>
      )}
    </div>
  )
}

export default WeeklyGraph