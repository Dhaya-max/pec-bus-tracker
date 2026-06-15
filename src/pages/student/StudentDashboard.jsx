import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useSocket } from '../../context/SocketContext'
import { useTheme } from '../../context/ThemeContext'
import axios from 'axios'
import BusMap from '../../components/BusMap'

const statusColor = {
  'On Time': 'bg-green-100 text-green-800',
  'Delayed': 'bg-yellow-100 text-yellow-800',
  'Breakdown': 'bg-red-100 text-red-800',
}

export default function StudentDashboard() {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('All')
  const [time, setTime] = useState(new Date())
  const [buses, setBuses] = useState([])
  const [loading, setLoading] = useState(true)
  const { logout, name, token } = useAuth()
  const { socket, busLocations } = useSocket()
  const { dark, toggleDark } = useTheme()

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    if (Notification.permission === 'default') Notification.requestPermission()
  }, [])

  useEffect(() => {
    const fetchBuses = async () => {
      try {
        const res = await axios.get('https://pec-bus-tracker-server-production.up.railway.app/api/bus/all', {
          headers: { Authorization: `Bearer ${token}` }
        })
        setBuses(res.data)
      } catch (err) {
        console.error('Failed to fetch buses', err)
      } finally {
        setLoading(false)
      }
    }
    fetchBuses()
  }, [token])

  useEffect(() => {
  if (!socket) return

  socket.on('bus:updated', (data) => {
    setBuses(prev => prev.map(b => {
      if (b.busNumber === data.busNumber) {
        if (data.status !== b.status && (data.status === 'Delayed' || data.status === 'Breakdown')) {
          if (Notification.permission === 'granted') {
            new Notification(`🚌 ${data.busNumber} - ${data.status}`, {
              body: data.message || `${data.busNumber} is now ${data.status} at ${data.currentStop}`,
              icon: '/pnm.jpg'
            })
          }
        }
        return { ...b, status: data.status, currentStop: data.currentStop, message: data.message }
      }
      return b
    }))
  })

  socket.on('bus:passengers', (data) => {
    setBuses(prev => prev.map(b =>
      b.busId === data.busId
        ? { ...b, passengers: data.passengers, capacity: data.capacity }
        : b
    ))
  })

  return () => {
    socket.off('bus:updated')
    socket.off('bus:passengers')
  }
}, [socket])

  const filtered = buses.filter(b => {
    const matchSearch = b.route.toLowerCase().includes(search.toLowerCase()) ||
      b.busNumber.toLowerCase().includes(search.toLowerCase()) ||
      b.currentStop?.toLowerCase().includes(search.toLowerCase()) ||
      b.driver?.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'All' || b.status === filter
    return matchSearch && matchFilter
  })

  const counts = {
    total: buses.length,
    onTime: buses.filter(b => b.status === 'On Time').length,
    delayed: buses.filter(b => b.status === 'Delayed').length,
    breakdown: buses.filter(b => b.status === 'Breakdown').length,
  }

  return (
    <div className="min-h-screen bg-[#EFF6FF] dark:bg-gray-900">
      <nav className="bg-[#1E3A5F] text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/pnm.jpg" alt="PEC" className="w-10 h-10 rounded-full object-cover" />
          <div>
            <h1 className="font-bold text-lg leading-tight">PEC Bus Tracker</h1>
            <p className="text-xs text-blue-200">Student Portal</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-blue-200">👋 {name}</span>
          <span className="text-sm text-blue-200">{time.toLocaleTimeString()}</span>
          <button onClick={toggleDark} className="text-sm px-3 py-1.5 rounded-lg border border-white text-white hover:bg-white hover:text-[#1E3A5F] transition-colors">
            {dark ? '☀️' : '🌙'}
          </button>
          <button onClick={logout} className="bg-white text-[#1E3A5F] text-sm px-4 py-1.5 rounded-lg font-medium hover:bg-blue-50">
            Logout
          </button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Buses', value: counts.total, color: 'text-[#1E3A5F] dark:text-blue-400' },
            { label: 'On Time', value: counts.onTime, color: 'text-green-600' },
            { label: 'Delayed', value: counts.delayed, color: 'text-yellow-600' },
            { label: 'Breakdown', value: counts.breakdown, color: 'text-red-600' },
          ].map(s => (
            <div key={s.label} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm text-center">
              <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5 mb-6">
          <h2 className="text-[#1E3A5F] dark:text-blue-400 font-bold text-lg mb-3">📍 Live Bus Locations</h2>
          {busLocations.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-gray-400 text-sm bg-[#EFF6FF] dark:bg-gray-700 rounded-xl">
              Waiting for driver to share location...
            </div>
          ) : (
            <BusMap busLocations={busLocations} />
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <input
            type="text"
            placeholder="Search by bus number, route or stop..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"
          />
          <div className="flex gap-2">
            {['All', 'On Time', 'Delayed', 'Breakdown'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors
                  ${filter === f ? 'bg-[#1E3A5F] text-white' : 'bg-white dark:bg-gray-800 dark:text-gray-300 text-gray-600 border border-gray-300 dark:border-gray-600 hover:bg-gray-50'}`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-center text-gray-400 py-10">Loading buses...</div>
        ) : (
          <div className="space-y-3">
            {filtered.length === 0 && (
              <div className="text-center text-gray-400 py-10">No buses found.</div>
            )}
            {filtered.map(bus => (
              <div key={bus.busId} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <img src="/pnm.jpg" alt="bus" className="w-12 h-12 rounded-xl object-cover" />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-[#1E3A5F] dark:text-blue-400">{bus.busNumber}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[bus.status]}`}>
                        {bus.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{bus.route} Route</p>
                    <p className="text-xs text-gray-400 mt-0.5">Last stop: {bus.currentStop} · Driver: {bus.driver}</p>
                    {bus.message && (
                      <p className="text-xs text-orange-500 mt-0.5">💬 {bus.message}</p>
                    )}
                  </div>
                  {bus.capacity && (
  <div className="mt-1">
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
        <div
          className={`h-1.5 rounded-full ${
            (bus.passengers / bus.capacity) >= 0.9 ? 'bg-red-500' :
            (bus.passengers / bus.capacity) >= 0.7 ? 'bg-yellow-500' : 'bg-green-500'
          }`}
          style={{ width: `${Math.round(((bus.passengers || 0) / bus.capacity) * 100)}%` }}
        />
      </div>
      <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
        {bus.passengers || 0}/{bus.capacity} seats
      </span>
    </div>
  </div>
)}
                </div>
                <div className="text-right">
                  <p className="text-[#1E3A5F] dark:text-blue-400 font-bold text-lg">{bus.eta}</p>
                  <p className="text-xs text-gray-400">ETA</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}