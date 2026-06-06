import { createContext, useContext, useEffect, useState } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from './AuthContext'

const SocketContext = createContext()

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null)
  const { token } = useAuth()

  useEffect(() => {
    if (!token) return
   const s = io('https://pec-bus-tracker-server-production.up.railway.app')
    setSocket(s)
    return () => s.disconnect()
  }, [token])

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  )
}

export function useSocket() {
  return useContext(SocketContext)
}