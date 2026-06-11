import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useSocket } from '../../context/SocketContext'
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

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
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
      setBuses(prev => prev.map(b =>
        b.busNumber === data.busNumber
          ? { ...b, status: data.status, currentStop: data.currentStop }
          : b
      ))
    })
    return () => socket.off('bus:updated')
  }, [socket])

  const filtered = buses.filter(b => {
    const matchSearch = b.route.toLowerCase().includes(search.toLowerCase()) ||
      b.busNumber.toLowerCase().includes(search.toLowerCase())
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
    <div className="min-h-screen bg-[#EFF6FF]">
      <nav className="bg-[#1E3A5F] text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
        // Replace: <span className="text-2xl">🚌</span>
<img src="/pnm.jpg" alt="PEC" className="w-10 h-10 rounded-full object-cover" />
          <div>
            <h1 className="font-bold text-lg leading-tight">PEC Bus Tracker</h1>
            <p className="text-xs text-blue-200">Student Portal</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-blue-200">👋 {name}</span>
          <span className="text-sm text-blue-200">{time.toLocaleTimeString()}</span>
          <button onClick={logout} className="bg-white text-[#1E3A5F] text-sm px-4 py-1.5 rounded-lg font-medium hover:bg-blue-50">
            Logout
          </button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Buses', value: counts.total, color: 'text-[#1E3A5F]' },
            { label: 'On Time', value: counts.onTime, color: 'text-green-600' },
            { label: 'Delayed', value: counts.delayed, color: 'text-yellow-600' },
            { label: 'Breakdown', value: counts.breakdown, color: 'text-red-600' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm text-center">
              <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-gray-500 text-sm mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Live Map */}
        <div className="bg-white rounded-xl shadow-sm p-5 mb-6">
          <h2 className="text-[#1E3A5F] font-bold text-lg mb-3">📍 Live Bus Locations</h2>
          {busLocations.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-gray-400 text-sm bg-[#EFF6FF] rounded-xl">
              Waiting for driver to share location...
            </div>
          ) : (
            <BusMap busLocations={busLocations} />
          )}
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <input
            type="text"
            placeholder="Search by bus or route..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"
          />
          <div className="flex gap-2">
            {['All', 'On Time', 'Delayed', 'Breakdown'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors
                  ${filter === f ? 'bg-[#1E3A5F] text-white' : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'}`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Bus List */}
        {loading ? (
          <div className="text-center text-gray-400 py-10">Loading buses...</div>
        ) : (
          <div className="space-y-3">
            {filtered.length === 0 && (
              <div className="text-center text-gray-400 py-10">No buses found.</div>
            )}
            {filtered.map(bus => (
              <div key={bus.busId} className="bg-white rounded-xl p-4 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="bg-[#1E3A5F] text-white w-12 h-12 rounded-xl flex items-center justify-center text-xl">
                    🚌
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-[#1E3A5F]">{bus.busNumber}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[bus.status]}`}>
                        {bus.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">{bus.route} Route</p>
                    <p className="text-xs text-gray-400 mt-0.5">Last stop: {bus.currentStop} · Driver: {bus.driver}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[#1E3A5F] font-bold text-lg">{bus.eta}</p>
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