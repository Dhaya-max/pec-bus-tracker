import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children, allowedRole }) {
  const { token, role } = useAuth()

  if (!token) return <Navigate to="/login" />
  if (allowedRole && role !== allowedRole) return <Navigate to="/login" />

  return children
}