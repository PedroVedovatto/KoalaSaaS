import { Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Contracts from './pages/Contracts'
import Alerts from './pages/Alerts'
import Settings from './pages/Settings'
import Layout from './components/Layout'

function App() {
  const [user, setUser] = useState(null) // Start with null user
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')
    
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData)
        setUser(parsedUser)
      } catch (error) {
        console.error('Error parsing user data:', error)
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      }
    }
    
    setLoading(false)
  }, [])

  const handleLogout = () => {
    setUser(null)
    // The Layout component will handle clearing localStorage
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Carregando...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        <Route 
          path="/login" 
          element={!user ? <Login setUser={setUser} /> : <Navigate to="/dashboard" />} 
        />
        <Route 
          path="/register" 
          element={!user ? <Register setUser={setUser} /> : <Navigate to="/dashboard" />} 
        />
        <Route 
          path="/dashboard" 
          element={user ? <Layout user={user} onLogout={handleLogout}><Dashboard /></Layout> : <Navigate to="/login" />} 
        />
        <Route 
          path="/contracts" 
          element={user ? <Layout user={user} onLogout={handleLogout}><Contracts /></Layout> : <Navigate to="/login" />} 
        />
        <Route 
          path="/alerts" 
          element={user ? <Layout user={user} onLogout={handleLogout}><Alerts /></Layout> : <Navigate to="/login" />} 
        />
        <Route 
          path="/settings" 
          element={user ? <Layout user={user} onLogout={handleLogout}><Settings /></Layout> : <Navigate to="/login" />} 
        />
        <Route path="/" element={<Navigate to="/dashboard" />} />
      </Routes>
    </div>
  )
}

export default App
