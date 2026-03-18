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
  const [user, setUser] = useState({ id: 1, name: 'Admin', email: 'admin@gmail.com' }) // Mock user for testing
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Remove qualquer token existente
    localStorage.removeItem('token')
    // Não faz nenhuma chamada de API
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
        <Route 
          path="/alerts" 
          element={user ? <Layout user={user}><Alerts /></Layout> : <Navigate to="/login" />} 
        />
        <Route 
          path="/settings" 
          element={user ? <Layout user={user}><Settings /></Layout> : <Navigate to="/login" />} 
        />
        <Route path="/" element={<Navigate to="/dashboard" />} />
      </Routes>
    </div>
  )
}

export default App
