import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useSocket } from '../../context/SocketContext'

const stops = ['Koyambedu', 'CMBT', 'Poonamallee', 'Porur', 'Vadapalani', 'Ashok Nagar', 'College Gate']
const statuses = ['On Time', 'Delayed', 'Breakdown']

export default function DriverPanel() {
  const [currentStop, setCurrentStop] = useState('Koyambedu')
  const [busStatus, setBusStatus] = useState('On Time')
  const [message, setMessage] = useState('')
  const [saved, setSaved] = useState(false)
  const [sharing, setSharing] = useState(false)
  const [locationStatus, setLocationStatus] = useState('')
  const { logout, name } = useAuth()
  const { socket } = useSocket()

  const statusColor = {
    'On Time': 'bg-green-100 text-green-800 border-green-200',
    'Delayed': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'Breakdown': 'bg-red-100 text-red-800 border-red-200',
  }

  const handleUpdate = () => {
    const update = {
      busId: 'bus-01',
      busNumber: 'Bus 01',
      route: 'Poonamallee',
      currentStop,
      status: busStatus,
      message,
      updatedAt: new Date().toISOString()
    }
    if (socket) socket.emit('driver:update', update)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const handleShareLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('Geolocation not supported.')
      return
    }

    setSharing(true)
    setLocationStatus('Sharing location...')

    navigator.geolocation.watchPosition(
      (pos) => {
        const locationData = {
          busNumber: 'Bus 01',
          busId: 'bus-01',
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          updatedAt: new Date().toISOString()
        }
        if (socket) socket.emit('driver:location', locationData)
        setLocationStatus('✅ Location shared live')
      },
      (err) => {
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

  return (
    <div className="min-h-screen bg-[#EFF6FF]">
      <nav className="bg-[#1E3A5F] text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/pnm.jpg" alt="PEC" className="w-10 h-10 rounded-full object-cover" />
          <div>
            <h1 className="font-bold text-lg leading-tight">PEC Bus Tracker</h1>
            <p className="text-xs text-blue-200">Driver Panel</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-blue-200">👋 {name}</span>
          <button onClick={logout} className="bg-white text-[#1E3A5F] text-sm px-4 py-1.5 rounded-lg font-medium hover:bg-blue-50">
            Logout
          </button>
        </div>
      </nav>

      <div className="max-w-xl mx-auto px-4 py-6 space-y-5">

        {/* Live Location */}
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h2 className="text-[#1E3A5F] font-bold text-lg mb-3">📍 Live Location</h2>
          <p className="text-sm text-gray-500 mb-3">Share your real-time GPS location with students and admin.</p>
          {locationStatus && (
            <p className="text-sm mb-3 text-gray-600">{locationStatus}</p>
          )}
          {!sharing ? (
            <button
              onClick={handleShareLocation}
              className="w-full bg-green-600 text-white py-2.5 rounded-lg font-medium hover:bg-green-700 transition-colors"
            >
              Start Sharing Location
            </button>
          ) : (
            <button
              onClick={handleStopSharing}
              className="w-full bg-red-500 text-white py-2.5 rounded-lg font-medium hover:bg-red-600 transition-colors"
            >
              Stop Sharing Location
            </button>
          )}
        </div>

        {/* Bus Info */}
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h2 className="text-[#1E3A5F] font-bold text-lg mb-4">My Bus Info</h2>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Bus Number', value: 'Bus 01' },
              { label: 'Route', value: 'Poonamallee' },
              { label: 'Departure', value: '8:00 AM' },
              { label: 'Capacity', value: '52 seats' },
            ].map(i => (
              <div key={i.label} className="bg-[#EFF6FF] rounded-lg p-3">
                <p className="text-xs text-gray-500">{i.label}</p>
                <p className="font-semibold text-[#1E3A5F] mt-0.5">{i.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Current Stop */}
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h2 className="text-[#1E3A5F] font-bold text-lg mb-3">Update Current Stop</h2>
          <div className="flex flex-wrap gap-2">
            {stops.map(stop => (
              <button
                key={stop}
                onClick={() => setCurrentStop(stop)}
                className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors
                  ${currentStop === stop ? 'bg-[#1E3A5F] text-white border-[#1E3A5F]' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}
              >
                {stop}
              </button>
            ))}
          </div>
          <p className="text-sm text-gray-500 mt-3">Selected: <span className="font-medium text-[#1E3A5F]">{currentStop}</span></p>
        </div>

        {/* Bus Status */}
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h2 className="text-[#1E3A5F] font-bold text-lg mb-3">Update Bus Status</h2>
          <div className="flex gap-3">
            {statuses.map(s => (
              <button
                key={s}
                onClick={() => setBusStatus(s)}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-colors
                  ${busStatus === s ? statusColor[s] : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Message */}
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h2 className="text-[#1E3A5F] font-bold text-lg mb-3">Message to Students</h2>
          <textarea
            rows={3}
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="e.g. Stuck in traffic near Koyambedu, 10 min delay..."
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] resize-none"
          />
        </div>

        <button
          onClick={handleUpdate}
          className="w-full bg-[#1E3A5F] text-white py-3 rounded-xl font-semibold hover:bg-[#162d4a] transition-colors"
        >
          {saved ? '✅ Updated Successfully!' : 'Push Update to Students'}
        </button>
      </div>
    </div>
  )
}