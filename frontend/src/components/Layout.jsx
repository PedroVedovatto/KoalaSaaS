import { Outlet, Link, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Building2, FileText, LogOut, Menu, X, Bell, Settings } from 'lucide-react'

export default function Layout({ user, onLogout, children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [unreadAlerts, setUnreadAlerts] = useState(0)
  const [hasVisitedAlerts, setHasVisitedAlerts] = useState(() => {
    return localStorage.getItem('hasVisitedAlerts') === 'true'
  })
  const navigate = useNavigate()

  useEffect(() => {
    // Fetch real unread alerts from backend
    const fetchUnreadAlerts = async () => {
      try {
        const response = await fetch('http://localhost:8000/public-alerts')
        const data = await response.json()
        
        if (data.alerts && data.alerts.length > 0) {
          const unreadCount = data.alerts.filter(alert => !alert.is_read).length
          setUnreadAlerts(unreadCount)
          console.log('🔔 Unread alerts loaded:', unreadCount)
        } else {
          setUnreadAlerts(0)
        }
      } catch (error) {
        console.error('Error fetching unread alerts:', error)
        setUnreadAlerts(0)
      }
    }
    
    fetchUnreadAlerts()
    
    // Listen for custom alerts update events
    const handleAlertsUpdate = (e) => {
      setUnreadAlerts(e.detail.unreadCount)
    }
    
    window.addEventListener('alertsUpdated', handleAlertsUpdate)
    
    // Listen for storage changes to update counter in real-time
    const handleStorageChange = (e) => {
      if (e.key === 'alerts') {
        fetchUnreadAlerts()
      }
    }
    
    window.addEventListener('storage', handleStorageChange)
    
    return () => {
      window.removeEventListener('alertsUpdated', handleAlertsUpdate)
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [])

  useEffect(() => {
    const checkIfOnAlertsPage = () => {
      if (window.location.pathname === '/alerts' && !hasVisitedAlerts) {
        setHasVisitedAlerts(true)
        localStorage.setItem('hasVisitedAlerts', 'true')
        console.log(' User visited alerts page, pulse effect disabled')
      }
    }
    
    checkIfOnAlertsPage()
    
    // Listen for route changes
    const handleRouteChange = () => {
      checkIfOnAlertsPage()
    }
    
    window.addEventListener('popstate', handleRouteChange)
    
    // Check periodically
    const interval = setInterval(checkIfOnAlertsPage, 1000)
    
    return () => {
      window.removeEventListener('popstate', handleRouteChange)
      clearInterval(interval)
    }
  }, [hasVisitedAlerts])

  const handleLogout = () => {
    // Limpar todos os dados do usuário
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('hasVisitedAlerts')
    localStorage.removeItem('contractTypes')
    localStorage.removeItem('contractStatuses')
    localStorage.removeItem('contracts')
    
    console.log('User logged out, data cleared')
    
    // Chamar função de logout do App
    if (onLogout) {
      onLogout()
    }
    
    // Redirecionar para login
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? '' : 'pointer-events-none'}`}>
        <div className={`fixed inset-0 bg-gray-600 transition-opacity ${sidebarOpen ? 'opacity-100' : 'opacity-0'}`} 
             onClick={() => setSidebarOpen(false)} />
        <div className={`fixed inset-y-0 left-0 flex flex-col w-64 bg-white transform transition-transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="flex items-center justify-between p-4 border-b">
            <h1 className="text-xl font-bold text-gray-900">KoalaSaaS</h1>
            <button onClick={() => setSidebarOpen(false)} className="text-gray-500 hover:text-gray-700">
              <X className="w-6 h-6" />
            </button>
          </div>
          <nav className="flex-1 p-4">
            <Link to="/dashboard" className="flex items-center p-3 text-gray-700 rounded-lg hover:bg-gray-100 mb-2">
              <Building2 className="w-5 h-5 mr-3" />
              Dashboard
            </Link>
            <Link to="/contracts" className="flex items-center p-3 text-gray-700 rounded-lg hover:bg-gray-100 mb-2">
              <FileText className="w-5 h-5 mr-3" />
              Contratos
            </Link>
            <Link to="/alerts" className="flex items-center p-3 text-gray-700 rounded-lg hover:bg-gray-100 relative">
              <Bell className="w-5 h-5 mr-3" />
              Alertas
              {unreadAlerts > 0 && (
                <span className={`absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center shadow-lg ${
                  hasVisitedAlerts ? '' : 'animate-pulse'
                }`}>
                  {unreadAlerts > 99 ? '99+' : unreadAlerts}
                </span>
              )}
            </Link>
            <Link to="/settings" className="flex items-center p-3 text-gray-700 rounded-lg hover:bg-gray-100">
              <Settings className="w-5 h-5 mr-3" />
              Configurações
            </Link>
          </nav>
          <div className="p-4 border-t">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                {(user.full_name || user.username || 'U').charAt(0).toUpperCase()}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700">{user.full_name || user.username || 'Usuário'}</p>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
            </div>
            <button onClick={handleLogout} className="flex items-center w-full p-3 text-gray-700 rounded-lg hover:bg-gray-100">
              <LogOut className="w-5 h-5 mr-3" />
              Sair
            </button>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col" style={{zIndex: 20}}>
        <div className="flex flex-col flex-1 bg-white border-r">
          <div className="flex items-center p-4 border-b">
            <h1 className="text-xl font-bold text-gray-900">KoalaSaaS</h1>
          </div>
          <nav className="flex-1 p-4">
            <Link to="/dashboard" className="flex items-center p-3 text-gray-700 rounded-lg hover:bg-gray-100 mb-2">
              <Building2 className="w-5 h-5 mr-3" />
              Dashboard
            </Link>
            <Link to="/contracts" className="flex items-center p-3 text-gray-700 rounded-lg hover:bg-gray-100 mb-2">
              <FileText className="w-5 h-5 mr-3" />
              Contratos
            </Link>
            <Link to="/alerts" className="flex items-center p-3 text-gray-700 rounded-lg hover:bg-gray-100 relative">
              <Bell className="w-5 h-5 mr-3" />
              Alertas
              {unreadAlerts > 0 && (
                <span className={`absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center shadow-lg ${
                  hasVisitedAlerts ? '' : 'animate-pulse'
                }`}>
                  {unreadAlerts > 99 ? '99+' : unreadAlerts}
                </span>
              )}
            </Link>
            <Link to="/settings" className="flex items-center p-3 text-gray-700 rounded-lg hover:bg-gray-100">
              <Settings className="w-5 h-5 mr-3" />
              Configurações
            </Link>
          </nav>
          <div className="p-4 border-t">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                {(user.full_name || user.username || 'U').charAt(0).toUpperCase()}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700">{user.full_name || user.username || 'Usuário'}</p>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
            </div>
            <button onClick={handleLogout} className="flex items-center w-full p-3 text-gray-700 rounded-lg hover:bg-gray-100">
              <LogOut className="w-5 h-5 mr-3" />
              Sair
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64 relative" style={{zIndex: 5}}>
        <div className="lg:hidden">
          <div className="flex items-center p-4 bg-white border-b">
            <button onClick={() => setSidebarOpen(true)} className="text-gray-500 hover:text-gray-700">
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="ml-4 text-lg font-semibold text-gray-900">KoalaSaaS</h1>
          </div>
        </div>
        <main className="p-6">
          {children ?? <Outlet />}
        </main>
      </div>
    </div>
  )
}
