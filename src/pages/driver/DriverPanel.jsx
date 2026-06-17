import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useSocket } from '../../context/SocketContext'
import { useTheme } from '../../context/ThemeContext'
import axios from 'axios'
import Toast from '../../components/Toast'
import useToast from '../../hooks/useToast'

const statuses = ['On Time', 'Delayed', 'Breakdown']

export default function DriverPanel() {
  const [bus, setBus] = useState(null)
  const [currentStop, setCurrentStop] = useState('')
  const [busStatus, setBusStatus] = useState('On Time')
  const [message, setMessage] = useState('')
  const [saved, setSaved] = useState(false)
  const [sharing, setSharing] = useState(false)
  const [locationStatus, setLocationStatus] = useState('')
  const [loadingBus, setLoadingBus] = useState(true)
  const [passengers, setPassengers] = useState(0)
  const { logout, name, token } = useAuth()
  const { socket } = useSocket()
  const { dark, toggleDark } = useTheme()
  const { toast, showToast, hideToast } = useToast()

  const statusColor = {
    'On Time': 'bg-green-100 text-green-800 border-green-200',
    'Delayed': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'Breakdown': 'bg-red-100 text-red-800 border-red-200',
  }

  useEffect(() => {
    const fetchMyBus = async () => {
      try {
        const res = await axios.get('https://pec-bus-tracker-server-production.up.railway.app/api/bus/mybus', {
          headers: { Authorization: `Bearer ${token}` }
        })
        setBus(res.data)
        setCurrentStop(res.data.currentStop)
        setBusStatus(res.data.status)
        setPassengers(res.data.passengers || 0)
      } catch (err) {
        console.error('No bus assigned', err)
      } finally {
        setLoadingBus(false)
      }
    }
    fetchMyBus()
  }, [token])

  const handlePassengerUpdate = async (newCount) => {
  if (newCount < 0 || newCount > bus.capacity) return
  setPassengers(newCount)
  if (socket) socket.emit('driver:passengers', {
    busId: bus.busId,
    busNumber: bus.busNumber,
    passengers: newCount,
    capacity: bus.capacity
  })
  try {
    await axios.post('https://pec-bus-tracker-server-production.up.railway.app/api/bus/passengers', {
      busId: bus.busId,
      passengers: newCount
    }, { headers: { Authorization: `Bearer ${token}` } })
  } catch (err) {
    showToast('Failed to update passengers', 'error')
  }
}
  const handleUpdate = async () => {
  if (!bus) return
  const update = {
    busId: bus.busId,
    busNumber: bus.busNumber,
    route: bus.route,
    currentStop,
    status: busStatus,
    message,
    passengers,
    updatedAt: new Date().toISOString()
  }
  if (socket) socket.emit('driver:update', update)
  try {
    await axios.post('https://pec-bus-tracker-server-production.up.railway.app/api/bus/status', update, {
      headers: { Authorization: `Bearer ${token}` }
    })
    showToast('Update pushed to students!', 'success')
  } catch (err) {
    console.error('Failed to update status', err)
    showToast('Failed to push update', 'error')
  }
  setSaved(true)
  setTimeout(() => setSaved(false), 3000)
}

  const handleShareLocation = () => {
    if (!navigator.geolocation || !bus) return
    setSharing(true)
    setLocationStatus('Sharing location...')
    navigator.geolocation.watchPosition(
      (pos) => {
        const locationData = {
          busNumber: bus.busNumber,
          busId: bus.busId,
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          updatedAt: new Date().toISOString()
        }
        if (socket) socket.emit('driver:location', locationData)
        setLocationStatus('✅ Location shared live')
      },
      () => {
        setLocationStatus('❌ Location access denied.')
        setSharing(false)
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    )
  }

  const handleStopSharing = () => {
    setSharing(false)
    setLocationStatus('Location sharing stopped.')
  }

  if (loadingBus) return (
    <div className="min-h-screen bg-[#EFF6FF] dark:bg-gray-900 flex items-center justify-center">
      <p className="text-gray-400">Loading your bus info...</p>
    </div>
  )

  if (!bus) return (
    <div className="min-h-screen bg-[#EFF6FF] dark:bg-gray-900 flex items-center justify-center">
      <p className="text-red-400">No bus assigned to you. Contact admin.</p>
    </div>
  )

  const occupancyPercent = Math.round((passengers / bus.capacity) * 100)
  const occupancyColor = occupancyPercent >= 90 ? 'bg-red-500' : occupancyPercent >= 70 ? 'bg-yellow-500' : 'bg-green-500'
  const stops = ['Koyambedu', 'CMBT', 'Poonamallee', 'Porur', 'Vadapalani', 'Ashok Nagar', 'College Gate']

  return (
    <div className="min-h-screen bg-[#EFF6FF] dark:bg-gray-900">
      {/* Navbar */}
      <nav className="bg-[#1E3A5F] text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src="/pnm.jpg" alt="PEC" className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
          <div>
            <h1 className="font-bold text-base leading-tight">PEC Bus Tracker</h1>
            <p className="text-xs text-blue-200">Driver Panel</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden sm:block text-sm text-blue-200 truncate max-w-[100px]">👋 {name}</span>
          <button onClick={toggleDark} className="text-lg px-2 py-1 rounded-lg border border-white text-white hover:bg-white hover:text-[#1E3A5F] transition-colors">
            {dark ? '☀️' : '🌙'}
          </button>
          <button onClick={logout} className="bg-white text-[#1E3A5F] text-xs sm:text-sm px-3 py-1.5 rounded-lg font-medium hover:bg-blue-50 whitespace-nowrap">
            Logout
          </button>
        </div>
      </nav>

      <div className="max-w-xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4">

        {/* Live Location */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 sm:p-5">
          <h2 className="text-[#1E3A5F] dark:text-blue-400 font-bold text-base sm:text-lg mb-2">📍 Live Location</h2>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-3">Share your real-time GPS location with students and admin.</p>
          {locationStatus && <p className="text-xs sm:text-sm mb-3 text-gray-600 dark:text-gray-300">{locationStatus}</p>}
          {!sharing ? (
            <button onClick={handleShareLocation} className="w-full bg-green-600 text-white py-2.5 rounded-lg font-medium hover:bg-green-700 transition-colors text-sm">
              Start Sharing Location
            </button>
          ) : (
            <button onClick={handleStopSharing} className="w-full bg-red-500 text-white py-2.5 rounded-lg font-medium hover:bg-red-600 transition-colors text-sm">
              Stop Sharing Location
            </button>
          )}
        </div>

        {/* Bus Info */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 sm:p-5">
          <h2 className="text-[#1E3A5F] dark:text-blue-400 font-bold text-base sm:text-lg mb-3">My Bus Info</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Bus Number', value: bus.busNumber },
              { label: 'Route', value: bus.route },
              { label: 'Departure', value: '8:00 AM' },
              { label: 'Capacity', value: `${bus.capacity} seats` },
            ].map(i => (
              <div key={i.label} className="bg-[#EFF6FF] dark:bg-gray-700 rounded-lg p-3">
                <p className="text-xs text-gray-500 dark:text-gray-400">{i.label}</p>
                <p className="font-semibold text-[#1E3A5F] dark:text-blue-400 mt-0.5 text-sm">{i.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Passenger Counter */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 sm:p-5">
          <h2 className="text-[#1E3A5F] dark:text-blue-400 font-bold text-base sm:text-lg mb-4">🧑‍🤝‍🧑 Passenger Count</h2>
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => handlePassengerUpdate(passengers - 1)}
              className="w-14 h-14 rounded-full bg-red-100 text-red-600 text-3xl font-bold hover:bg-red-200 transition-colors flex items-center justify-center"
            >
              −
            </button>
            <div className="text-center">
              <p className="text-5xl font-bold text-[#1E3A5F] dark:text-blue-400">{passengers}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">of {bus.capacity} seats</p>
            </div>
            <button
              onClick={() => handlePassengerUpdate(passengers + 1)}
              className="w-14 h-14 rounded-full bg-green-100 text-green-600 text-3xl font-bold hover:bg-green-200 transition-colors flex items-center justify-center"
            >
              +
            </button>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all ${occupancyColor}`}
              style={{ width: `${occupancyPercent}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">{occupancyPercent}% full</p>
        </div>

        {/* Current Stop */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 sm:p-5">
          <h2 className="text-[#1E3A5F] dark:text-blue-400 font-bold text-base sm:text-lg mb-3">Update Current Stop</h2>
          <div className="flex flex-wrap gap-2">
            {stops.map(stop => (
              <button
                key={stop}
                onClick={() => setCurrentStop(stop)}
                className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-medium border transition-colors
                  ${currentStop === stop ? 'bg-[#1E3A5F] text-white border-[#1E3A5F]' : 'bg-white dark:bg-gray-700 dark:text-gray-300 text-gray-600 border-gray-300 dark:border-gray-600'}`}
              >
                {stop}
              </button>
            ))}
          </div>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-3">
            Selected: <span className="font-medium text-[#1E3A5F] dark:text-blue-400">{currentStop}</span>
          </p>
        </div>

        {/* Bus Status */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 sm:p-5">
          <h2 className="text-[#1E3A5F] dark:text-blue-400 font-bold text-base sm:text-lg mb-3">Update Bus Status</h2>
          <div className="flex gap-2">
            {statuses.map(s => (
              <button
                key={s}
                onClick={() => setBusStatus(s)}
                className={`flex-1 py-2.5 rounded-lg text-xs sm:text-sm font-medium border transition-colors
                  ${busStatus === s ? statusColor[s] : 'bg-white dark:bg-gray-700 dark:text-gray-300 text-gray-600 border-gray-300 dark:border-gray-600'}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Message */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 sm:p-5">
          <h2 className="text-[#1E3A5F] dark:text-blue-400 font-bold text-base sm:text-lg mb-3">Message to Students</h2>
          <textarea
            rows={3}
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="e.g. Stuck in traffic near Koyambedu, 10 min delay..."
            className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] resize-none"
          />
        </div>

        <button
          onClick={handleUpdate}
          className="w-full bg-[#1E3A5F] text-white py-3 rounded-xl font-semibold hover:bg-[#162d4a] transition-colors text-sm sm:text-base"
        >
          {saved ? '✅ Updated Successfully!' : 'Push Update to Students'}
        </button>
      </div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
    </div>
  )
}