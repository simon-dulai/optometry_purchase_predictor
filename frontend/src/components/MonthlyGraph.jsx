// original alternative graph - invalid now
import React, { useState, useEffect } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Bar } from 'react-chartjs-2'
import { format, subMonths } from 'date-fns'
import { api } from '../services/api'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
)

const MonthlyGraph = () => {
  const [monthlyData, setMonthlyData] = useState(null)
  const [loading, setLoading] = useState(false)

  const fetchMonthlyData = async () => {
    setLoading(true)
    try {
      const currentMonth = format(new Date(), 'yyyy-MM')
      const response = await api.get(`/analytics/monthly?month=${currentMonth}`)
      setMonthlyData(response.data)
    } catch (error) {
      console.error('Failed to fetch monthly data:', error)
      setMonthlyData(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMonthlyData()
  }, [])

  const chartData = monthlyData ? {
    labels: ['Predicted', 'Actual'],
    datasets: [
      {
        label: 'Sales Amount',
        data: [monthlyData.total_predicted, monthlyData.total_actual],
        backgroundColor: [
          'rgba(0, 255, 255, 0.8)',
          'rgba(255, 0, 255, 0.8)',
        ],
        borderColor: [
          '#00ffff',
          '#ff00ff',
        ],
        borderWidth: 2,
        borderRadius: 4,
      },
    ],
  } : { labels: [], datasets: [] }

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
        text: monthlyData ? `Monthly Comparison - ${monthlyData.month}` : 'Monthly Comparison',
        color: '#ffffff',
        font: {
          family: 'Rajdhani',
          size: 18,
          weight: 'bold',
        },
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `£${context.parsed.y.toFixed(2)}`
          }
        }
      }
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
      <h3 className="cyberpunk-heading mb-2">Monthly Comparison</h3>
      {loading ? (
        <div className="cyberpunk-spinner"></div>
      ) : monthlyData ? (
        <div style={{ height: '300px' }}>
          <Bar data={chartData} options={chartOptions} />
          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <div className={`text-${monthlyData.variance >= 0 ? 'success' : 'error'}`}>
              Variance: £{monthlyData.variance.toFixed(2)}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center text-muted">No monthly data available</div>
      )}
    </div>
  )
}

export default MonthlyGraph