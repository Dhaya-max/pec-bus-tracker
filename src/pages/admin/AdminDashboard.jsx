import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useSocket } from '../../context/SocketContext'
import BusMap from '../../components/BusMap'
import axios from 'axios'

export default function AdminDashboard() {
  const [buses, setBuses] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('buses')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ number: '', route: '', driver: '', capacity: '' })
  const [saving, setSaving] = useState(false)
  const { logout, token } = useAuth()
  const { busLocations } = useSocket()

  const API = 'https://pec-bus-tracker-server-production.up.railway.app'
  const headers = { Authorization: `Bearer ${token}` }

  useEffect(() => {
    const fetchBuses = async () => {
      try {
        const res = await axios.get(`${API}/api/bus/all`, { headers })
        setBuses(res.data)
      } catch (err) {
        console.error('Failed to fetch buses', err)
      } finally {
        setLoading(false)
      }
    }
    fetchBuses()
  }, [token])

  const handleAdd = async () => {
    if (!form.number || !form.route || !form.driver) return
    setSaving(true)
    try {
      const newBus = {
        busId: `bus-${Date.now()}`,
        busNumber: form.number,
        route: form.route,
        driver: form.driver,
        capacity: Number(form.capacity) || 52,
        status: 'On Time',
        currentStop: '',
        eta: 'N/A'
      }
      const res = await axios.post(`${API}/api/bus/add`, newBus, { headers })
      setBuses(prev => [...prev, res.data.bus])
      setForm({ number: '', route: '', driver: '', capacity: '' })
      setShowForm(false)
    } catch (err) {
      console.error('Failed to add bus', err)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (busId) => {
    try {
      await axios.delete(`${API}/api/bus/delete/${busId}`, { headers })
      setBuses(prev => prev.filter(b => b.busId !== busId))
    } catch (err) {
      console.error('Failed to delete bus', err)
    }
  }

  const toggleStatus = async (busId, currentStatus) => {
    const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active'
    try {
      await axios.post(`${API}/api/bus/toggle`, { busId, status: newStatus }, { headers })
      setBuses(prev => prev.map(b => b.busId === busId ? { ...b, status: newStatus } : b))
    } catch (err) {
      console.error('Failed to toggle status', err)
    }
  }

  return (
    <div className="min-h-screen bg-[#EFF6FF]">
      <nav className="bg-[#1E3A5F] text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/pnm.jpg" alt="PEC" className="w-10 h-10 rounded-full object-cover" />
          <div>
            <h1 className="font-bold text-lg leading-tight">PEC Bus Tracker</h1>
            <p className="text-xs text-blue-200">Admin Dashboard</p>
          </div>
        </div>
        <button onClick={logout} className="bg-white text-[#1E3A5F] text-sm px-4 py-1.5 rounded-lg font-medium hover:bg-blue-50">
          Logout
        </button>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Buses', value: buses.length },
            { label: 'Active', value: buses.filter(b => b.status === 'Active' || b.status === 'On Time').length },
            { label: 'Inactive', value: buses.filter(b => b.status === 'Inactive').length },
            { label: 'Total Routes', value: new Set(buses.map(b => b.route)).size },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm text-center">
              <p className="text-3xl font-bold text-[#1E3A5F]">{s.value}</p>
              <p className="text-gray-500 text-sm mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-5">
          {['buses', 'routes', 'schedule', 'map'].map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors
                ${tab === t ? 'bg-[#1E3A5F] text-white' : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'}`}
            >
              {t === 'map' ? '📍 Live Map' : t}
            </button>
          ))}
        </div>

        {/* Buses Tab */}
        {tab === 'buses' && (
          <div className="bg-white rounded-xl shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-[#1E3A5F] text-lg">Manage Buses</h2>
              <button
                onClick={() => setShowForm(!showForm)}
                className="bg-[#F59E0B] text-white text-sm px-4 py-2 rounded-lg font-medium hover:bg-yellow-500"
              >
                + Add Bus
              </button>
            </div>

            {showForm && (
              <div className="bg-[#EFF6FF] rounded-lg p-4 mb-4 grid grid-cols-2 gap-3">
                {[
                  { key: 'number', placeholder: 'Bus Number (e.g. Bus 77)' },
                  { key: 'route', placeholder: 'Route (e.g. Avadi)' },
                  { key: 'driver', placeholder: 'Driver Name' },
                  { key: 'capacity', placeholder: 'Capacity (e.g. 52)' },
                ].map(f => (
                  <input
                    key={f.key}
                    placeholder={f.placeholder}
                    value={form[f.key]}
                    onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"
                  />
                ))}
                <button
                  onClick={handleAdd}
                  disabled={saving}
                  className="col-span-2 bg-[#1E3A5F] text-white py-2 rounded-lg text-sm font-medium hover:bg-[#162d4a] disabled:opacity-60"
                >
                  {saving ? 'Saving...' : 'Save Bus'}
                </button>
              </div>
            )}

            {loading ? (
              <div className="text-center text-gray-400 py-10">Loading buses...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 border-b border-gray-100">
                      <th className="pb-3 font-medium">Bus</th>
                      <th className="pb-3 font-medium">Route</th>
                      <th className="pb-3 font-medium">Driver</th>
                      <th className="pb-3 font-medium">Capacity</th>
                      <th className="pb-3 font-medium">Status</th>
                      <th className="pb-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {buses.map(bus => (
                      <tr key={bus.busId} className="hover:bg-gray-50">
                        <td className="py-3 font-medium text-[#1E3A5F]">{bus.busNumber}</td>
                        <td className="py-3 text-gray-600">{bus.route}</td>
                        <td className="py-3 text-gray-600">{bus.driver}</td>
                        <td className="py-3 text-gray-600">{bus.capacity}</td>
                        <td className="py-3">
                          <span className={`text-xs px-2 py-1 rounded-full font-medium
                            ${bus.status === 'Active' || bus.status === 'On Time' ? 'bg-green-100 text-green-800' :
                              bus.status === 'Delayed' ? 'bg-yellow-100 text-yellow-800' :
                              bus.status === 'Breakdown' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-600'}`}>
                            {bus.status}
                          </span>
                        </td>
                        <td className="py-3">
                          <div className="flex gap-2">
                            <button
                              onClick={() => toggleStatus(bus.busId, bus.status)}
                              className="text-xs text-[#1E3A5F] border border-[#1E3A5F] px-2 py-1 rounded hover:bg-blue-50"
                            >
                              Toggle
                            </button>
                            <button
                              onClick={() => handleDelete(bus.busId)}
                              className="text-xs text-red-600 border border-red-300 px-2 py-1 rounded hover:bg-red-50"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Routes Tab */}
        {tab === 'routes' && (
          <div className="bg-white rounded-xl shadow-sm p-5">
            <h2 className="font-bold text-[#1E3A5F] text-lg mb-4">Routes Overview</h2>
            <div className="space-y-3">
              {[...new Set(buses.map(b => b.route))].map((route, i) => (
                <div key={route} className="flex items-center justify-between p-3 bg-[#EFF6FF] rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="bg-[#1E3A5F] text-white text-xs w-7 h-7 rounded-full flex items-center justify-center font-bold">{i + 1}</span>
                    <span className="font-medium text-[#1E3A5F]">{route}</span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {buses.filter(b => b.route === route).length} bus{buses.filter(b => b.route === route).length > 1 ? 'es' : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Schedule Tab */}
        {tab === 'schedule' && (
          <div className="bg-white rounded-xl shadow-sm p-5">
            <h2 className="font-bold text-[#1E3A5F] text-lg mb-4">Daily Schedule</h2>
            <div className="space-y-3">
              {buses.map(bus => (
                <div key={bus.busId} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50">
                  <div>
                    <p className="font-medium text-[#1E3A5F]">{bus.busNumber} — {bus.route}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Driver: {bus.driver}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-[#1E3A5F]">8:00 AM</p>
                    <p className="text-xs text-gray-400">Departure</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Map Tab */}
        {tab === 'map' && (
          <div className="bg-white rounded-xl shadow-sm p-5">
            <h2 className="font-bold text-[#1E3A5F] text-lg mb-3">📍 Live Bus Locations</h2>
            {busLocations.length === 0 ? (
              <div className="h-40 flex items-center justify-center text-gray-400 text-sm bg-[#EFF6FF] rounded-xl">
                Waiting for driver to share location...
              </div>
            ) : (
              <BusMap busLocations={busLocations} />
            )}
          </div>
        )}
      </div>
    </div>
  )
}