import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useSocket } from '../../context/SocketContext'
import { useTheme } from '../../context/ThemeContext'
import BusMap from '../../components/BusMap'
import axios from 'axios'
import Toast from '../../components/Toast'
import useToast from '../../hooks/useToast'
import SkeletonCard from '../../components/SkeletonCard'

export default function AdminDashboard() {
  const [buses, setBuses] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('buses')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ number: '', route: '', driver: '', capacity: '' })
  const [saving, setSaving] = useState(false)
  const [editBus, setEditBus] = useState(null)
  const [editForm, setEditForm] = useState({ driver: '', route: '', capacity: '' })
  const { logout, token } = useAuth()
  const { busLocations } = useSocket()
  const { dark, toggleDark } = useTheme()
  const { toast, showToast, hideToast } = useToast()
  const [busSearch, setBusSearch] = useState('')

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
  if (!form.number || !form.route || !form.driver) {
    showToast('Please fill all required fields', 'warning')
    return
  }
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
    showToast(`${form.number} added successfully!`, 'success')
  } catch (err) {
    console.error('Failed to add bus', err)
    showToast('Failed to add bus', 'error')
  } finally {
    setSaving(false)
  }
}
 const handleDelete = async (busId, busNumber) => {
  try {
    await axios.delete(`${API}/api/bus/delete/${busId}`, { headers })
    setBuses(prev => prev.filter(b => b.busId !== busId))
    showToast(`${busNumber} deleted`, 'info')
  } catch (err) {
    showToast('Failed to delete bus', 'error')
  }
}

 const toggleStatus = async (busId, currentStatus) => {
  const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active'
  try {
    await axios.post(`${API}/api/bus/toggle`, { busId, status: newStatus }, { headers })
    setBuses(prev => prev.map(b => b.busId === busId ? { ...b, status: newStatus } : b))
    showToast(`Status changed to ${newStatus}`, 'info')
  } catch (err) {
    showToast('Failed to toggle status', 'error')
  }
}
 const handleEditSave = async () => {
  try {
    await axios.post(`${API}/api/bus/update`, {
      busId: editBus.busId,
      driver: editForm.driver,
      route: editForm.route,
      capacity: Number(editForm.capacity)
    }, { headers })
    setBuses(prev => prev.map(b => b.busId === editBus.busId
      ? { ...b, driver: editForm.driver, route: editForm.route, capacity: Number(editForm.capacity) }
      : b
    ))
    setEditBus(null)
    showToast('Bus updated successfully!', 'success')
  } catch (err) {
    showToast('Failed to update bus', 'error')
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
            <p className="text-xs text-blue-200">Admin Dashboard</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={toggleDark} className="text-lg px-2 py-1 rounded-lg border border-white text-white hover:bg-white hover:text-[#1E3A5F] transition-colors">
            {dark ? '☀️' : '🌙'}
          </button>
          <button onClick={logout} className="bg-white text-[#1E3A5F] text-xs sm:text-sm px-3 py-1.5 rounded-lg font-medium hover:bg-blue-50 whitespace-nowrap">
            Logout
          </button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-6">

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 sm:mb-6">
          {[
            { label: 'Total Buses', value: buses.length },
            { label: 'Active', value: buses.filter(b => b.status === 'Active' || b.status === 'On Time').length },
            { label: 'Inactive', value: buses.filter(b => b.status === 'Inactive').length },
            { label: 'Total Routes', value: new Set(buses.map(b => b.route)).size },
          ].map(s => (
            <div key={s.label} className="bg-white dark:bg-gray-800 rounded-xl p-3 sm:p-4 shadow-sm text-center">
              <p className="text-2xl sm:text-3xl font-bold text-[#1E3A5F] dark:text-blue-400">{s.value}</p>
              <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs - scrollable on mobile */}
        <div className="flex gap-2 mb-4 sm:mb-5 overflow-x-auto pb-1">
          {['buses', 'routes', 'schedule', 'map'].map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium capitalize transition-colors whitespace-nowrap flex-shrink-0
                ${tab === t ? 'bg-[#1E3A5F] text-white' : 'bg-white dark:bg-gray-800 dark:text-gray-300 text-gray-600 border border-gray-300 dark:border-gray-600'}`}
            >
              {t === 'map' ? '📍 Live Map' : t}
            </button>
          ))}
        </div>

        {/* Buses Tab */}
        {tab === 'buses' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 sm:p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-[#1E3A5F] dark:text-blue-400 text-base sm:text-lg">Manage Buses</h2>
              <button onClick={() => setShowForm(!showForm)} className="bg-[#F59E0B] text-white text-xs sm:text-sm px-3 sm:px-4 py-2 rounded-lg font-medium hover:bg-yellow-500 whitespace-nowrap">
                + Add Bus
              </button>
            </div>

            {showForm && (
              <div className="bg-[#EFF6FF] dark:bg-gray-700 rounded-lg p-4 mb-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                    className="border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"
                  />
                ))}
                <button
                  onClick={handleAdd}
                  disabled={saving}
                  className="sm:col-span-2 bg-[#1E3A5F] text-white py-2 rounded-lg text-sm font-medium hover:bg-[#162d4a] disabled:opacity-60"
                >
                  {saving ? 'Saving...' : 'Save Bus'}
                </button>
              </div>
            )}
            

           <input
  type="text"
  placeholder="Search by bus number, route or driver..."
  value={busSearch}
  onChange={e => setBusSearch(e.target.value)}
  className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] mb-4"
/>

{loading ?  (
  <>
    <div className="hidden md:block space-y-3">
      {[...Array(5)].map((_, i) => <SkeletonCard key={i} />)}
    </div>
    <div className="md:hidden space-y-3">
      {[...Array(5)].map((_, i) => <SkeletonCard key={i} />)}
    </div>
  </>
) : (
              <>
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">
                        <th className="pb-3 font-medium">Bus</th>
                        <th className="pb-3 font-medium">Route</th>
                        <th className="pb-3 font-medium">Driver</th>
                        <th className="pb-3 font-medium">Capacity</th>
                        <th className="pb-3 font-medium">Status</th>
                        <th className="pb-3 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                      {buses.filter(b =>
  b.busNumber?.toLowerCase().includes(busSearch.toLowerCase()) ||
  b.route?.toLowerCase().includes(busSearch.toLowerCase()) ||
  b.driver?.toLowerCase().includes(busSearch.toLowerCase())).map(bus => (
                        <tr key={bus.busId} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="py-3 font-medium text-[#1E3A5F] dark:text-blue-400">{bus.busNumber}</td>
                        <button onClick={() => handleDelete(bus.busId, bus.busNumber)} className="text-xs text-red-600 border border-red-300 px-2 py-1 rounded hover:bg-red-50">Delete</button>
                          <td className="py-3 text-gray-600 dark:text-gray-300">{bus.route}</td>
                          <td className="py-3 text-gray-600 dark:text-gray-300">{bus.driver}</td>
                          <td className="py-3 text-gray-600 dark:text-gray-300">{bus.capacity}</td>
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
                              <button onClick={() => toggleStatus(bus.busId, bus.status)} className="text-xs text-[#1E3A5F] border border-[#1E3A5F] px-2 py-1 rounded hover:bg-blue-50">Toggle</button>
                              <button onClick={() => { setEditBus(bus); setEditForm({ driver: bus.driver, route: bus.route, capacity: bus.capacity }) }} className="text-xs text-green-600 border border-green-300 px-2 py-1 rounded hover:bg-green-50">Edit</button>
                              <button onClick={() => handleDelete(bus.busId)} className="text-xs text-red-600 border border-red-300 px-2 py-1 rounded hover:bg-red-50">Delete</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden space-y-3">
                  {buses.map(bus => (
                    <div key={bus.busId} className="border border-gray-100 dark:border-gray-700 rounded-xl p-3">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-bold text-[#1E3A5F] dark:text-blue-400">{bus.busNumber}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{bus.route} · {bus.driver}</p>
                          <p className="text-xs text-gray-400">Capacity: {bus.capacity}</p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full font-medium flex-shrink-0
                          ${bus.status === 'Active' || bus.status === 'On Time' ? 'bg-green-100 text-green-800' :
                            bus.status === 'Delayed' ? 'bg-yellow-100 text-yellow-800' :
                            bus.status === 'Breakdown' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-600'}`}>
                          {bus.status}
                        </span>
                      </div>
                      <div className="flex gap-2 mt-2">
                        <button onClick={() => toggleStatus(bus.busId, bus.status)} className="flex-1 text-xs text-[#1E3A5F] border border-[#1E3A5F] px-2 py-1.5 rounded-lg">Toggle</button>
                        <button onClick={() => { setEditBus(bus); setEditForm({ driver: bus.driver, route: bus.route, capacity: bus.capacity }) }} className="flex-1 text-xs text-green-600 border border-green-300 px-2 py-1.5 rounded-lg">Edit</button>
                       <button onClick={() => handleDelete(bus.busId, bus.busNumber)} className="flex-1 text-xs text-red-600 border border-red-300 px-2 py-1.5 rounded-lg">Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Routes Tab */}
        {tab === 'routes' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 sm:p-5">
            <h2 className="font-bold text-[#1E3A5F] dark:text-blue-400 text-base sm:text-lg mb-4">Routes Overview</h2>
            <div className="space-y-3">
              {[...new Set(buses.map(b => b.route))].map((route, i) => (
                <div key={route} className="flex items-center justify-between p-3 bg-[#EFF6FF] dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="bg-[#1E3A5F] text-white text-xs w-7 h-7 rounded-full flex items-center justify-center font-bold flex-shrink-0">{i + 1}</span>
                    <span className="font-medium text-[#1E3A5F] dark:text-blue-400 text-sm">{route}</span>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                    {buses.filter(b => b.route === route).length} bus{buses.filter(b => b.route === route).length > 1 ? 'es' : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Schedule Tab */}
        {tab === 'schedule' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 sm:p-5">
            <h2 className="font-bold text-[#1E3A5F] dark:text-blue-400 text-base sm:text-lg mb-4">Daily Schedule</h2>
            <div className="space-y-3">
              {buses.map(bus => (
                <div key={bus.busId} className="flex items-center justify-between p-3 border border-gray-100 dark:border-gray-700 rounded-lg">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-[#1E3A5F] dark:text-blue-400 text-sm truncate">{bus.busNumber} — {bus.route}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">Driver: {bus.driver}</p>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <p className="text-sm font-semibold text-[#1E3A5F] dark:text-blue-400">8:00 AM</p>
                    <p className="text-xs text-gray-400">Departure</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Map Tab */}
        {tab === 'map' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 sm:p-5">
            <h2 className="font-bold text-[#1E3A5F] dark:text-blue-400 text-base sm:text-lg mb-3">📍 Live Bus Locations</h2>
            {busLocations.length === 0 ? (
              <div className="h-40 flex items-center justify-center text-gray-400 text-sm bg-[#EFF6FF] dark:bg-gray-700 rounded-xl">
                Waiting for driver to share location...
              </div>
            ) : (
              <BusMap busLocations={busLocations} />
            )}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editBus && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-2xl p-6 w-full sm:max-w-sm shadow-xl">
            <h3 className="font-bold text-[#1E3A5F] dark:text-blue-400 text-lg mb-4">Edit {editBus.busNumber}</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400 mb-1 block">Driver Name</label>
                <input value={editForm.driver} onChange={e => setEditForm({ ...editForm, driver: e.target.value })} className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]" />
              </div>
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400 mb-1 block">Route</label>
                <input value={editForm.route} onChange={e => setEditForm({ ...editForm, route: e.target.value })} className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]" />
              </div>
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400 mb-1 block">Capacity</label>
                <input type="number" value={editForm.capacity} onChange={e => setEditForm({ ...editForm, capacity: e.target.value })} className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]" />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setEditBus(null)} className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 py-2.5 rounded-lg text-sm">Cancel</button>
              <button onClick={handleEditSave} className="flex-1 bg-[#1E3A5F] text-white py-2.5 rounded-lg text-sm hover:bg-[#162d4a]">Save Changes</button>
            </div>
          </div>
        </div>
      )}
       {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
    </div>
  )
}