import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useSocket } from '../../context/SocketContext'
import { useTheme } from '../../context/ThemeContext'
import axios from 'axios'
import BusMap from '../../components/BusMap'
import SkeletonCard from '../../components/SkeletonCard'



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
  const [preferredBusId, setPreferredBusId] = useState(localStorage.getItem('preferredBusId') || null)
  const [selectedBus, setSelectedBus] = useState(null)
  const [sort, setSort] = useState('default')
  const [sosAlert, setSosAlert] = useState(null)
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

 useEffect(() => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').then(reg => {
      console.log('SW registered', reg)
    })
  }
  if (Notification.permission === 'default') {
    Notification.requestPermission()
  }
}, [])

  useEffect(() => {
    const fetchBuses = async () => {
      try {
        const res = await axios.get('https://pec-bus-tracker-server-production.up.railway.app/api/bus/all', {
          headers: { Authorization: `Bearer ${token}` }
        })
        setBuses(res.data)
        const sos = res.data.find(b => b.status === 'Breakdown' && b.message?.includes('🆘'))
setSosAlert(sos || null)
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
          if (data.status === 'Breakdown' && data.message?.includes('🆘')) {
  setSosAlert(data)
} else if (data.busNumber === sosAlert?.busNumber) {
  setSosAlert(null)
}
          if (data.status !== b.status && (data.status === 'Delayed' || data.status === 'Breakdown')) {
            if (Notification.permission === 'granted') {
            navigator.serviceWorker.ready.then(reg => {
  reg.showNotification(`🚌 ${data.busNumber} - ${data.status}`, {
    body: data.message || `${data.busNumber} is now ${data.status} at ${data.currentStop}`,
    icon: '/pnm.jpg',
    badge: '/pnm.jpg',
    vibrate: [200, 100, 200]
  })
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
        b.busId === data.busId ? { ...b, passengers: data.passengers, capacity: data.capacity } : b
      ))
    })
    return () => {
      socket.off('bus:updated')
      socket.off('bus:passengers')
    }
  }, [socket])

  const filtered = buses
  .filter(b => {
    const matchSearch = b.route.toLowerCase().includes(search.toLowerCase()) ||
      b.busNumber.toLowerCase().includes(search.toLowerCase()) ||
      b.currentStop?.toLowerCase().includes(search.toLowerCase()) ||
      b.driver?.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'All' ? true :
      filter === 'My Bus' ? b.busId === preferredBusId :
      b.status === filter
    return matchSearch && matchFilter
  })
 .sort((a, b) => {
  if (a.busId === preferredBusId) return -1
  if (b.busId === preferredBusId) return 1
  if (sort === 'eta') {
    const etaA = parseInt(a.eta) || 999
    const etaB = parseInt(b.eta) || 999
    return etaA - etaB
  }
  if (sort === 'route') return a.route.localeCompare(b.route)
  if (sort === 'status') return a.status.localeCompare(b.status)
  return 0
})

  const counts = {
    total: buses.length,
    onTime: buses.filter(b => b.status === 'On Time').length,
    delayed: buses.filter(b => b.status === 'Delayed').length,
    breakdown: buses.filter(b => b.status === 'Breakdown').length,
  }
  const togglePreferred = (busId) => {
  if (preferredBusId === busId) {
    setPreferredBusId(null)
    localStorage.removeItem('preferredBusId')
  } else {
    setPreferredBusId(busId)
    localStorage.setItem('preferredBusId', busId)
  }
}

  return (
    <div className="min-h-screen bg-[#EFF6FF] dark:bg-gray-900">
      {/* Navbar */}
      <nav className="bg-[#1E3A5F] text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src="/pnm.jpg" alt="PEC" className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
          <div>
            <h1 className="font-bold text-base leading-tight">PEC Bus Tracker</h1>
            <p className="text-xs text-blue-200">Student Portal</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden sm:block text-sm text-blue-200 truncate max-w-[100px]">👋 {name}</span>
          <span className="hidden md:block text-sm text-blue-200">{time.toLocaleTimeString()}</span>
          <button onClick={toggleDark} className="text-lg px-2 py-1 rounded-lg border border-white text-white hover:bg-white hover:text-[#1E3A5F] transition-colors">
            {dark ? '☀️' : '🌙'}
          </button>
          <button onClick={logout} className="bg-white text-[#1E3A5F] text-xs sm:text-sm px-3 py-1.5 rounded-lg font-medium hover:bg-blue-50 whitespace-nowrap">
            Logout
          </button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-6">

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 sm:mb-6">
          {[
            { label: 'Total Buses', value: counts.total, color: 'text-[#1E3A5F] dark:text-blue-400' },
            { label: 'On Time', value: counts.onTime, color: 'text-green-600' },
            { label: 'Delayed', value: counts.delayed, color: 'text-yellow-600' },
            { label: 'Breakdown', value: counts.breakdown, color: 'text-red-600' },
          ].map(s => (
            <div key={s.label} className="bg-white dark:bg-gray-800 rounded-xl p-3 sm:p-4 shadow-sm text-center">
              <p className={`text-2xl sm:text-3xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm mt-1">{s.label}</p>
            </div>
          ))}
        </div>
 {sosAlert && (
  <div className="bg-red-600 text-white rounded-xl p-4 mb-4 flex items-center gap-3 animate-pulse">
    <span className="text-2xl">🆘</span>
    <div>
      <p className="font-bold">Emergency Alert!</p>
      <p className="text-sm opacity-90">
        {sosAlert.busNumber} — {sosAlert.message}
      </p>
    </div>
  </div>
)}

        {/* Live Map */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 sm:p-5 mb-4 sm:mb-6">
          <h2 className="text-[#1E3A5F] dark:text-blue-400 font-bold text-base sm:text-lg mb-3">📍 Live Bus Locations</h2>
          {busLocations.length === 0 ? (
            <div className="h-32 sm:h-40 flex items-center justify-center text-gray-400 text-sm bg-[#EFF6FF] dark:bg-gray-700 rounded-xl">
              Waiting for driver to share location...
            </div>
          ) : (
            <BusMap busLocations={busLocations} />
          )}
        </div>

        {/* Search & Filter */}
       <div className="flex flex-col gap-2 mb-4 sm:mb-5">
  <input
    type="text"
    placeholder="Search by bus number, route or stop..."
    value={search}
    onChange={e => setSearch(e.target.value)}
    className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"
  />
  <div className="flex gap-2 overflow-x-auto pb-1">
    {['All', 'My Bus', 'On Time', 'Delayed', 'Breakdown'].map(f => (
      <button
        key={f}
        onClick={() => setFilter(f)}
        className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0
          ${filter === f ? 'bg-[#1E3A5F] text-white' : 'bg-white dark:bg-gray-800 dark:text-gray-300 text-gray-600 border border-gray-300 dark:border-gray-600'}`}
      >
        {f === 'My Bus' ? '⭐ My Bus' : f}
      </button>
    ))}
  </div>
  <div className="flex items-center gap-2 overflow-x-auto pb-1">
    <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">Sort:</span>
    {[
      { value: 'default', label: 'Default' },
      { value: 'eta', label: '⏱ ETA' },
      { value: 'route', label: '🗺 Route' },
      { value: 'status', label: '🚦 Status' },
    ].map(s => (
      <button
        key={s.value}
        onClick={() => setSort(s.value)}
        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap flex-shrink-0
          ${sort === s.value ? 'bg-[#1E3A5F] text-white' : 'bg-white dark:bg-gray-800 dark:text-gray-300 text-gray-600 border border-gray-300 dark:border-gray-600'}`}
      >
        {s.label}
      </button>
    ))}
  </div>
</div>
        {/* Bus List */}
       {loading ? (
  <div className="space-y-3">
    {[...Array(5)].map((_, i) => <SkeletonCard key={i} />)}
  </div>
) : (
          <div className="space-y-3">
            {filtered.length === 0 && (
              <div className="text-center text-gray-400 py-10">No buses found.</div>
            )}
            {filtered.map(bus => (
            <div key={bus.busId} className="bg-white dark:bg-gray-800 rounded-xl p-3 sm:p-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedBus(bus)}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <img src="/pnm.jpg" alt="bus" className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl object-cover flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-[#1E3A5F] dark:text-blue-400 text-sm sm:text-base">{bus.busNumber}</h3>
                       <button
  onClick={(e) => { e.stopPropagation(); togglePreferred(bus.busId) }}
  className="text-base leading-none"
>
 

  {preferredBusId === bus.busId ? '⭐' : '☆'}
</button>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[bus.status]}`}>
                          {bus.status}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">{bus.route} Route</p>
                      <p className="text-xs text-gray-400 mt-0.5 truncate">
                        {bus.currentStop && `Stop: ${bus.currentStop} · `}Driver: {bus.driver}
                      </p>
                      {bus.message && (
                        <p className="text-xs text-orange-500 mt-0.5">💬 {bus.message}</p>
                      )}
                      {bus.capacity > 0 && (
                        <div className="mt-1.5 flex items-center gap-2">
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
                            {bus.passengers || 0}/{bus.capacity}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-[#1E3A5F] dark:text-blue-400 font-bold text-base sm:text-lg">{bus.eta}</p>
                    <p className="text-xs text-gray-400">ETA</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {selectedBus && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4" onClick={() => setSelectedBus(null)}>
    <div className="bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
      
      
      
      {/* Header */}
      <div className="bg-[#1E3A5F] text-white p-5 rounded-t-2xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/pnm.jpg" alt="bus" className="w-10 h-10 rounded-xl object-cover" />
          <div>
            <h2 className="font-bold text-lg">{selectedBus.busNumber}</h2>
            <p className="text-xs text-blue-200">{selectedBus.route} Route</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColor[selectedBus.status]}`}>
            {selectedBus.status}
          </span>
          <button onClick={() => setSelectedBus(null)} className="text-white opacity-70 hover:opacity-100 text-xl ml-2">✕</button>
        </div>
      </div>

      {/* Body */}
      <div className="p-5 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Driver', value: selectedBus.driver, icon: '👨‍✈️' },
            { label: 'Capacity', value: `${selectedBus.capacity} seats`, icon: '💺' },
            { label: 'Current Stop', value: selectedBus.currentStop || 'N/A', icon: '📍' },
            { label: 'ETA', value: selectedBus.eta || 'N/A', icon: '⏱️' },
          ].map(i => (
            <div key={i.label} className="bg-[#EFF6FF] dark:bg-gray-700 rounded-xl p-3">
              <p className="text-xs text-gray-500 dark:text-gray-400">{i.icon} {i.label}</p>
              <p className="font-semibold text-[#1E3A5F] dark:text-blue-400 mt-0.5 text-sm">{i.value}</p>
            </div>
          ))}
        </div>

        {/* Occupancy */}
        {selectedBus.capacity > 0 && (
          <div>
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
              <span>🧑‍🤝‍🧑 Occupancy</span>
              <span>{selectedBus.passengers || 0}/{selectedBus.capacity} seats</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
              <div
                className={`h-2.5 rounded-full ${
                  ((selectedBus.passengers || 0) / selectedBus.capacity) >= 0.9 ? 'bg-red-500' :
                  ((selectedBus.passengers || 0) / selectedBus.capacity) >= 0.7 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${Math.round(((selectedBus.passengers || 0) / selectedBus.capacity) * 100)}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1 text-right">
              {Math.round(((selectedBus.passengers || 0) / selectedBus.capacity) * 100)}% full
            </p>
          </div>
        )}

        {/* Message */}
        {selectedBus.message && (
          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-3">
            <p className="text-xs text-orange-600 dark:text-orange-400 font-medium mb-1">💬 Driver Message</p>
            <p className="text-sm text-orange-700 dark:text-orange-300">{selectedBus.message}</p>
          </div>
        )}

        {/* Preferred button */}
        <button
          onClick={() => togglePreferred(selectedBus.busId)}
          className={`w-full py-2.5 rounded-xl font-medium text-sm transition-colors ${
            preferredBusId === selectedBus.busId
              ? 'bg-yellow-100 text-yellow-700 border border-yellow-300'
              : 'bg-[#1E3A5F] text-white hover:bg-[#162d4a]'
          }`}
        >
          {preferredBusId === selectedBus.busId ? '⭐ Remove from My Bus' : '☆ Set as My Bus'}
        </button>
      </div>
    </div>
  </div>
)}
    </div>
  )
}