import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const initialBuses = [
  { id: 1, number: 'Bus 01', route: 'Poonamallee', driver: 'Ravi Kumar', capacity: 52, status: 'Active' },
  { id: 2, number: 'Bus 02', route: 'Anna Nagar', driver: 'Suresh M', capacity: 48, status: 'Active' },
  { id: 3, number: 'Bus 03', route: 'Tambaram', driver: 'Manoj R', capacity: 52, status: 'Active' },
  { id: 4, number: 'Bus 04', route: 'Velachery', driver: 'Prakash S', capacity: 40, status: 'Inactive' },
  { id: 5, number: 'Bus 05', route: 'Porur', driver: 'Anand T', capacity: 52, status: 'Active' },
]

export default function AdminDashboard() {
  const [buses, setBuses] = useState(initialBuses)
  const [tab, setTab] = useState('buses')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ number: '', route: '', driver: '', capacity: '' })
  const navigate = useNavigate()

  const handleAdd = () => {
    if (!form.number || !form.route || !form.driver) return
    setBuses([...buses, { id: Date.now(), ...form, capacity: Number(form.capacity), status: 'Active' }])
    setForm({ number: '', route: '', driver: '', capacity: '' })
    setShowForm(false)
  }

  const handleDelete = (id) => {
    setBuses(buses.filter(b => b.id !== id))
  }

  const toggleStatus = (id) => {
    setBuses(buses.map(b => b.id === id
      ? { ...b, status: b.status === 'Active' ? 'Inactive' : 'Active' }
      : b))
  }

  return (
    <div className="min-h-screen bg-[#EFF6FF]">
      {/* Navbar */}
      <nav className="bg-[#1E3A5F] text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🚌</span>
          <div>
            <h1 className="font-bold text-lg leading-tight">PEC Bus Tracker</h1>
            <p className="text-xs text-blue-200">Admin Dashboard</p>
          </div>
        </div>
        <button
          onClick={() => navigate('/login')}
          className="bg-white text-[#1E3A5F] text-sm px-4 py-1.5 rounded-lg font-medium hover:bg-blue-50"
        >
          Logout
        </button>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-6">

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Buses', value: buses.length },
            { label: 'Active', value: buses.filter(b => b.status === 'Active').length },
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
          {['buses', 'routes', 'schedule'].map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors
                ${tab === t ? 'bg-[#1E3A5F] text-white' : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'}`}
            >
              {t}
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

            {/* Add Form */}
            {showForm && (
              <div className="bg-[#EFF6FF] rounded-lg p-4 mb-4 grid grid-cols-2 gap-3">
                {[
                  { key: 'number', placeholder: 'Bus Number (e.g. Bus 06)' },
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
                  className="col-span-2 bg-[#1E3A5F] text-white py-2 rounded-lg text-sm font-medium hover:bg-[#162d4a]"
                >
                  Save Bus
                </button>
              </div>
            )}

            {/* Bus Table */}
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
                    <tr key={bus.id} className="hover:bg-gray-50">
                      <td className="py-3 font-medium text-[#1E3A5F]">{bus.number}</td>
                      <td className="py-3 text-gray-600">{bus.route}</td>
                      <td className="py-3 text-gray-600">{bus.driver}</td>
                      <td className="py-3 text-gray-600">{bus.capacity}</td>
                      <td className="py-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium
                          ${bus.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                          {bus.status}
                        </span>
                      </td>
                      <td className="py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => toggleStatus(bus.id)}
                            className="text-xs text-[#1E3A5F] border border-[#1E3A5F] px-2 py-1 rounded hover:bg-blue-50"
                          >
                            Toggle
                          </button>
                          <button
                            onClick={() => handleDelete(bus.id)}
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
          </div>
        )}

        {/* Routes Tab */}
        {tab === 'routes' && (
          <div className="bg-white rounded-xl shadow-sm p-5">
            <h2 className="font-bold text-[#1E3A5F] text-lg mb-4">Routes Overview</h2>
            <div className="space-y-3">
              {['Poonamallee', 'Anna Nagar', 'Tambaram', 'Velachery', 'Porur', 'Avadi', 'Chromepet'].map((route, i) => (
                <div key={route} className="flex items-center justify-between p-3 bg-[#EFF6FF] rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="bg-[#1E3A5F] text-white text-xs w-7 h-7 rounded-full flex items-center justify-center font-bold">
                      {i + 1}
                    </span>
                    <span className="font-medium text-[#1E3A5F]">{route}</span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {4 + i} stops · {20 + i * 3} km
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
              {initialBuses.map(bus => (
                <div key={bus.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50">
                  <div>
                    <p className="font-medium text-[#1E3A5F]">{bus.number} — {bus.route}</p>
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
      </div>
    </div>
  )
}