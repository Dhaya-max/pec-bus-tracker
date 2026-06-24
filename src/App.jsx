import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import StudentDashboard from './pages/student/StudentDashboard'
import DriverPanel from './pages/driver/DriverPanel'
import AdminDashboard from './pages/admin/AdminDashboard'
import ProtectedRoute from './components/ProtectedRoute'
import Signup from './pages/Signup'
import { useAuth } from './context/AuthContext'

function App() {
  const { token, role } = useAuth()

  const redirectIfLoggedIn = (element) => {
    if (token && role) return <Navigate to={`/${role}`} />
    return element
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={token && role ? <Navigate to={`/${role}`} /> : <Navigate to="/login" />} />
        <Route path="/login" element={redirectIfLoggedIn(<Login />)} />
        <Route path="/signup" element={redirectIfLoggedIn(<Signup />)} />
        <Route path="/student" element={
          <ProtectedRoute allowedRole="student">
            <StudentDashboard />
          </ProtectedRoute>
        } />
        <Route path="/driver" element={
          <ProtectedRoute allowedRole="driver">
            <DriverPanel />
          </ProtectedRoute>
        } />
        <Route path="/admin" element={
          <ProtectedRoute allowedRole="admin">
            <AdminDashboard />
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  )
}

export default App