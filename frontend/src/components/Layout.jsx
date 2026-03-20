import { Outlet, Link, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Building2, FileText, LogOut, Menu, X, Bell, Settings } from 'lucide-react'

export default function Layout({ user, onLogout, children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [unreadAlerts, setUnreadAlerts] = useState(0)
  const navigate = useNavigate()

  useEffect(() => {
    // Load unread alerts from localStorage
    const loadUnreadAlerts = () => {
      try {
        const savedAlerts = localStorage.getItem('alerts')
        if (savedAlerts) {
          const alerts = JSON.parse(savedAlerts)
          const unreadCount = alerts.filter(alert => !alert.is_read).length
          setUnreadAlerts(unreadCount)
        } else {
          setUnreadAlerts(2) // Default mock value
        }
      } catch (error) {
        console.error('Error loading unread alerts:', error)
        setUnreadAlerts(0)
      }
    }
    
    loadUnreadAlerts()
    
    // Listen for custom alerts update events
    const handleAlertsUpdate = (e) => {
      setUnreadAlerts(e.detail.unreadCount)
    }
    
    window.addEventListener('alertsUpdated', handleAlertsUpdate)
    
    // Listen for storage changes to update counter in real-time
    const handleStorageChange = (e) => {
      if (e.key === 'alerts') {
        loadUnreadAlerts()
      }
    }
    
    window.addEventListener('storage', handleStorageChange)
    
    return () => {
      window.removeEventListener('alertsUpdated', handleAlertsUpdate)
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [])

  const handleLogout = () => {
    // Limpar todos os dados do usuário
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    
    // Limpar outros dados relacionados ao usuário se necessário
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
                <span className="absolute top-2 right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {unreadAlerts > 9 ? '9+' : unreadAlerts}
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
                <span className="absolute top-2 right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {unreadAlerts > 9 ? '9+' : unreadAlerts}
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
