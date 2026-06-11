import { createContext, useContext, useEffect, useState } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from './AuthContext'

const SocketContext = createContext()

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null)
  const [busLocations, setBusLocations] = useState([])
  const { token } = useAuth()

  useEffect(() => {
    if (!token) return
    const s = io('https://pec-bus-tracker-server-production.up.railway.app')
    setSocket(s)

    s.on('bus:location', (data) => {
      setBusLocations(prev => {
        const exists = prev.find(b => b.busNumber === data.busNumber)
        if (exists) {
          return prev.map(b => b.busNumber === data.busNumber ? data : b)
        }
        return [...prev, data]
      })
    })

    return () => s.disconnect()
  }, [token])

  return (
    <SocketContext.Provider value={{ socket, busLocations }}>
      {children}
    </SocketContext.Provider>
  )
}

export function useSocket() {
  return useContext(SocketContext)
}