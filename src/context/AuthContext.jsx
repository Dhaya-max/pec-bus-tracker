import { createContext, useContext, useState } from 'react'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [token] = useState(localStorage.getItem('token'))
  const [role] = useState(localStorage.getItem('role'))
  const [name] = useState(localStorage.getItem('name'))

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('role')
    localStorage.removeItem('name')
    window.location.href = '/login'
  }

  return (
    <AuthContext.Provider value={{ token, role, name, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}