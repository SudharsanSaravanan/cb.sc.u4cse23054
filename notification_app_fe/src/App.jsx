import { useState, useEffect } from 'react'
import { Log, getLogs, getLogStats } from './logger'
import './App.css'

function App() {
  const [count, setCount] = useState(0)
  const [logs, setLogs] = useState([])
  const [stats, setStats] = useState(null)

  useEffect(() => {
    Log('frontend', 'info', 'App', 'Application mounted and initialized')
  }, [])

  const handleIncrement = async () => {
    try {
      const newCount = count + 1
      setCount(newCount)
      
      await Log('frontend', 'info', 'App', `Counter incremented to ${newCount}`, {
        previousValue: count,
        newValue: newCount,
      })
    } catch (error) {
      Log('frontend', 'error', 'App', `Counter increment failed: ${error.message}`, {
        error: error.toString(),
      })
    }
  }

  const handleDecrement = async () => {
    try {
      const newCount = count - 1
      setCount(newCount)
      
      await Log('frontend', 'info', 'App', `Counter decremented to ${newCount}`, {
        previousValue: count,
        newValue: newCount,
      })
    } catch (error) {
      Log('frontend', 'error', 'App', `Counter decrement failed: ${error.message}`, {
        error: error.toString(),
      })
    }
  }

  const handleReset = async () => {
    try {
      setCount(0)
      
      await Log('frontend', 'info', 'App', 'Counter has been reset to 0', {
        previousValue: count,
      })
    } catch (error) {
      Log('frontend', 'error', 'App', `Counter reset failed: ${error.message}`, {
        error: error.toString(),
      })
    }
  }

  const fetchLogs = async () => {
    try {
      const result = await getLogs({ stack: 'frontend' }, 50)
      setLogs(result.logs || [])
      await Log('frontend', 'info', 'App', `Fetched ${result.logs?.length || 0} logs`)
    } catch (error) {
      Log('frontend', 'error', 'App', `Failed to fetch logs: ${error.message}`)
    }
  }

  const fetchStats = async () => {
    try {
      const result = await getLogStats()
      setStats(result.stats)
      await Log('frontend', 'info', 'App', 'Log statistics retrieved')
    } catch (error) {
      Log('frontend', 'error', 'App', `Failed to fetch stats: ${error.message}`)
    }
  }

  return (
    <div className='max-screen-h bg-gray-200 p-5 min-h-screen'>
      <div className='max-w-4xl mx-auto'>
        <div className='mb-8'>
          <h1 className='text-4xl font-bold text-gray-800 mb-2'>
            Notification System - Logging Middleware
          </h1>
        </div>

        <div className='bg-white rounded-lg shadow-md p-6 mb-6'>
          <h2 className='text-2xl font-semibold mb-4'>Counter</h2>
          <div className='flex items-center justify-center gap-4 mb-4'>
            <button
              onClick={handleDecrement}
              className='px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition'
            >
              Decrement
            </button>
            <div className='text-4xl font-bold text-blue-600 min-w-24 text-center'>
              {count}
            </div>
            <button
              onClick={handleIncrement}
              className='px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition'
            >
              Increment
            </button>
          </div>
          <button
            onClick={handleReset}
            className='w-full px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition'
          >
            Reset
          </button>
        </div>

        <div className='bg-white rounded-lg shadow-md p-6 mb-6'>
          <h2 className='text-2xl font-semibold mb-4'>Logging Dashboard</h2>
          <div className='flex gap-4 mb-4'>
            <button
              onClick={fetchLogs}
              className='px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition'
            >
              Fetch Recent Logs
            </button>
            <button
              onClick={fetchStats}
              className='px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition'
            >
              Get Statistics
            </button>
          </div>

          {stats && (
            <div className='bg-gray-50 p-4 rounded mb-4'>
              <h3 className='font-semibold mb-2'>Log Statistics</h3>
              <div className='grid grid-cols-3 gap-4 text-sm'>
                <div>
                  <p className='font-semibold text-gray-600'>Total Logs</p>
                  <p className='text-2xl font-bold text-blue-600'>{stats.totalLogs}</p>
                </div>
                <div>
                  <p className='font-semibold text-gray-600'>By Level</p>
                  <div className='text-xs space-y-1'>
                    {Object.entries(stats.byLevel || {}).map(([level, count]) => (
                      <p key={level}>{level}: {count}</p>
                    ))}
                  </div>
                </div>
                <div>
                  <p className='font-semibold text-gray-600'>By Stack</p>
                  <div className='text-xs space-y-1'>
                    {Object.entries(stats.byStack || {}).map(([stack, count]) => (
                      <p key={stack}>{stack}: {count}</p>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {logs.length > 0 && (
            <div className='bg-gray-50 p-4 rounded'>
              <h3 className='font-semibold mb-3'>Recent Frontend Logs</h3>
              <div className='space-y-2 max-h-96 overflow-y-auto text-xs'>
                {logs.map((log, idx) => (
                  <div
                    key={idx}
                    className={`p-2 rounded border-l-4 ${
                      log.level === 'error'
                        ? 'border-red-500 bg-red-50'
                        : log.level === 'warning'
                        ? 'border-yellow-500 bg-yellow-50'
                        : 'border-blue-500 bg-blue-50'
                    }`}
                  >
                    <p className='font-semibold'>
                      [{log.level.toUpperCase()}] {log.package}
                    </p>
                    <p className='text-gray-700'>{log.message}</p>
                    <p className='text-gray-500 text-xs'>
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default App
