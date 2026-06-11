import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import axios from 'axios'
import { GoogleLogin } from '@react-oauth/google'
import { jwtDecode } from 'jwt-decode'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const [role, setRole] = useState('student')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { login } = useAuth()

  const redirectByRole = (role) => navigate(`/${role}`)

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await axios.post('https://pec-bus-tracker-server-production.up.railway.app/api/auth/login', {
        email, password, role
      })
      login(res.data.token, res.data.role, res.data.name)
      redirectByRole(res.data.role)
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const decoded = jwtDecode(credentialResponse.credential)
      const { name, email } = decoded

      // Try to login first
      try {
        const res = await axios.post('https://pec-bus-tracker-server-production.up.railway.app/api/auth/login', {
          email, password: email, role
        })
        login(res.data.token, res.data.role, res.data.name)
        redirectByRole(res.data.role)
      } catch {
        // If not found, register then login
        await axios.post('https://pec-bus-tracker-server-production.up.railway.app/api/auth/register', {
          name, email, password: email, role
        })
        const res = await axios.post('https://pec-bus-tracker-server-production.up.railway.app/api/auth/login', {
          email, password: email, role
        })
        login(res.data.token, res.data.role, res.data.name)
        redirectByRole(res.data.role)
      }
    } catch (err) {
      setError('Google login failed. Please try again.')
    }
  }

  return (
    <div className="min-h-screen bg-[#EFF6FF] flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-md w-full max-w-md p-8">

        <div className="text-center mb-8">
         // Line 69 - replace the emoji div with:
<img src="/pnm.jpg" alt="PEC Logo" className="w-14 h-14 rounded-full mx-auto mb-3 object-cover" />
          <h1 className="text-2xl font-bold text-[#1E3A5F]">PEC Bus Tracker</h1>
          <p className="text-gray-500 text-sm mt-1">Panimalar Engineering College</p>
        </div>

        {/* Role selector */}
        <div className="flex rounded-lg overflow-hidden border border-gray-200 mb-6">
          {['student', 'driver', 'admin'].map((r) => (
            <button
              type="button"
              key={r}
              onClick={() => setRole(r)}
              className={`flex-1 py-2 text-sm font-medium capitalize transition-colors
                ${role === r ? 'bg-[#1E3A5F] text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
            >
              {r}
            </button>
          ))}
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm px-4 py-2 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@panimalar.ac.in"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#1E3A5F] text-white py-2.5 rounded-lg font-medium hover:bg-[#162d4a] transition-colors mt-2 disabled:opacity-60"
          >
            {loading ? 'Logging in...' : `Login as ${role.charAt(0).toUpperCase() + role.slice(1)}`}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-gray-200"></div>
          <span className="text-sm text-gray-400">or</span>
          <div className="flex-1 h-px bg-gray-200"></div>
        </div>

        {/* Google Sign In */}
        <div className="flex justify-center">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => setError('Google login failed.')}
            width="100%"
            text="signin_with"
            shape="rectangular"
            theme="outline"
          />
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Panimalar Engineering College © 2025
        </p>
        <p className="text-center text-sm text-gray-500 mt-3">
          Don't have an account?{' '}
          <Link to="/signup" className="text-[#1E3A5F] font-semibold hover:underline">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  )
}
