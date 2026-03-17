import { Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Contracts from './pages/Contracts'
import Layout from './components/Layout'
import { authAPI } from './services/api'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    console.log('App useEffect triggered')
    const token = localStorage.getItem('token')
    console.log('Token from localStorage:', token)
    
    // Clear old fake token
    if (token === 'fake-token') {
      console.log('Removing old fake token')
      localStorage.removeItem('token')
      setLoading(false)
      return
    }
    
    if (token) {
      console.log('Token found, calling authAPI.getMe()')
      authAPI.getMe()
        .then(response => {
          console.log('User data received:', response.data)
          setUser(response.data)
        })
        .catch((error) => {
          console.error('Error getting user data:', error)
          localStorage.removeItem('token')
        })
        .finally(() => {
          setLoading(false)
        })
    } else {
      console.log('No token found')
      setLoading(false)
    }
  }, [])

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
          element={user ? <Layout user={user}><Dashboard /></Layout> : <Navigate to="/login" />} 
        />
        <Route 
          path="/contracts" 
          element={user ? <Layout user={user}><Contracts /></Layout> : <Navigate to="/login" />} 
        />
        <Route path="/" element={<Navigate to="/dashboard" />} />
      </Routes>
    </div>
  )
}

export default App
