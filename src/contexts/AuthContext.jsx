import { createContext, useContext, useState, useEffect } from 'react'
import { login as apiLogin, register as apiRegister, verifyToken } from '../services/api.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('fundsight_token')
    if (!token) {
      setLoading(false)
      return
    }
    verifyToken()
      .then((res) => {
        if (res.user) setUser(res.user)
        else localStorage.removeItem('fundsight_token')
      })
      .catch(() => localStorage.removeItem('fundsight_token'))
      .finally(() => setLoading(false))
  }, [])

  const loginUser = async (username, password) => {
    const res = await apiLogin(username, password)
    if (res.error) throw new Error(res.error)
    localStorage.setItem('fundsight_token', res.token)
    setUser(res.user)
    return res
  }

  const registerUser = async (username, password) => {
    const res = await apiRegister(username, password)
    if (res.error) throw new Error(res.error)
    localStorage.setItem('fundsight_token', res.token)
    setUser(res.user)
    return res
  }

  const logout = () => {
    localStorage.removeItem('fundsight_token')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, loginUser, registerUser, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
