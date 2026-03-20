import { useState, useEffect } from 'react'
import { Bell, BellRing, Check, CheckCircle, AlertTriangle, Clock, X, Filter } from 'lucide-react'
import LoadingScreen from '../components/LoadingScreen'

export default function Alerts() {
  const [alerts, setAlerts] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all, unread
  const [error, setError] = useState(null)
  const [selectedAlert, setSelectedAlert] = useState(null)
  const [showAlertDetails, setShowAlertDetails] = useState(false)

  useEffect(() => {
    // Mock data for alerts
    const mockAlerts = [
      {
        id: 1,
        message: 'Contrato de Serviço A expira em 7 dias',
        severity: 'high',
        is_read: false,
        is_concern: false,
        created_at: new Date().toISOString(),
        contract_id: 1,
        contract_name: 'Contrato de Serviço A'
      },
      {
        id: 2,
        message: 'Novo contrato adicionado: Contrato de Software B',
        severity: 'low',
        is_read: false,
        is_concern: false,
        created_at: new Date().toISOString(),
        contract_id: 2,
        contract_name: 'Contrato de Software B'
      },
      {
        id: 3,
        message: 'Pagamento do Contrato de Consultoria C pendente',
        severity: 'medium',
        is_read: true,
        is_concern: true,
        created_at: new Date().toISOString(),
        contract_id: 3,
        contract_name: 'Contrato de Consultoria C'
      }
    ]

    setTimeout(() => {
      setAlerts(mockAlerts)
      setUnreadCount(mockAlerts.filter(a => !a.is_read).length)
      setLoading(false)
    }, 1000)
  }, [])

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800'
      case 'high':
        return 'bg-orange-100 text-orange-800'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800'
      case 'low':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const markAsRead = (alertId) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, is_read: true } : alert
    ))
    setUnreadCount(prev => Math.max(0, prev - 1))
  }

  const markAllAsRead = () => {
    setAlerts(prev => prev.map(alert => ({ ...alert, is_read: true })))
    setUnreadCount(0)
  }

  const toggleConcern = (alertId) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, is_concern: !alert.is_concern } : alert
    ))
  }

  const handleAlertClick = (alert) => {
    setSelectedAlert(alert)
    setShowAlertDetails(true)
    
    // Marcar como lido se ainda não estiver
    if (!alert.is_read) {
      markAsRead(alert.id)
    }
  }

  const filteredAlerts = filter === 'unread' 
    ? alerts.filter(alert => !alert.is_read)
    : alerts

  if (error) {
    return (
      <div className="text-center text-gray-500">
        <div className="mb-4">{error}</div>
        <button 
          onClick={() => window.location.reload()} 
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Recarregar página
        </button>
      </div>
    )
  }

  return (
    <div>
      {loading && <LoadingScreen />}
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Alertas</h1>
            <p className="text-gray-600">
              {unreadCount > 0 
                ? `${unreadCount} alerta(s) não lido(s)` 
                : 'Nenhum alerta não lido'
              }
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todos os alertas</option>
              <option value="unread">Não lidos</option>
            </select>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Marcar todos como lidos
              </button>
            )}
          </div>
        </div>

        {/* Alert Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-purple-500">
            <div className="flex items-center">
              <AlertTriangle className="w-8 h-8 text-purple-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Alerta</p>
                <p className="text-xl font-bold text-gray-900">
                  {alerts.filter(a => a.is_concern).length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-red-500">
            <div className="flex items-center">
              <AlertTriangle className="w-8 h-8 text-red-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Crítico</p>
                <p className="text-xl font-bold text-gray-900">
                  {alerts.filter(a => a.severity === 'critical').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-orange-500">
            <div className="flex items-center">
              <AlertTriangle className="w-8 h-8 text-orange-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Alta</p>
                <p className="text-xl font-bold text-gray-900">
                  {alerts.filter(a => a.severity === 'high').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-yellow-500">
            <div className="flex items-center">
              <Clock className="w-8 h-8 text-yellow-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Média</p>
                <p className="text-xl font-bold text-gray-900">
                  {alerts.filter(a => a.severity === 'medium').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
            <div className="flex items-center">
              <Bell className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Baixa</p>
                <p className="text-xl font-bold text-gray-900">
                  {alerts.filter(a => a.severity === 'low').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Alerts List */}
        <div className="bg-white shadow rounded-lg">
          {filteredAlerts.length === 0 ? (
            <div className="p-10 text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-green-50 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-gray-900">Nenhum alerta</h3>
              <p className="mt-1 text-sm text-gray-600">
                {filter === 'unread' ? 'Nenhum alerta não lido no momento.' : 'Nenhum alerta encontrado.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredAlerts.map((alert) => (
                <div 
                  key={alert.id}
                  className={`p-4 hover:bg-gray-50 cursor-pointer ${!alert.is_read ? 'bg-blue-50' : ''} ${alert.is_concern ? 'border-l-4 border-red-500' : ''}`}
                  onClick={() => handleAlertClick(alert)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className={`p-2 rounded-full ${getSeverityColor(alert.severity)}`}>
                        {alert.is_concern ? (
                          <AlertTriangle className="w-4 h-4" />
                        ) : (
                          <Bell className="w-4 h-4" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSeverityColor(alert.severity)}`}>
                            {alert.severity === 'critical' ? 'Crítico' : 
                             alert.severity === 'high' ? 'Alta' : 
                             alert.severity === 'medium' ? 'Média' : 'Baixa'}
                          </span>
                          {!alert.is_read && (
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                              Novo
                            </span>
                          )}
                          {alert.is_concern && (
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                              Alerta
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-gray-900 font-medium">
                          {alert.message}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          {new Date(alert.created_at).toLocaleString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      {alert.is_read ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleConcern(alert.id)
                          }}
                          className={`p-2 ${alert.is_concern ? 'text-red-600 hover:text-red-800 hover:bg-red-100' : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'} rounded-lg transition-colors`}
                          title={alert.is_concern ? "Remover preocupação" : "Marcar como preocupação"}
                        >
                          <AlertTriangle className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            markAsRead(alert.id)
                          }}
                          className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-lg transition-colors"
                          title="Marcar como lido"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Modal de Detalhes do Alerta */}
      {showAlertDetails && selectedAlert && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Detalhes do Alerta</h3>
              <button
                onClick={() => setShowAlertDetails(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Mensagem</label>
                <p className="mt-1 text-sm text-gray-900">{selectedAlert.message}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Severidade</label>
                <div className="mt-1">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    selectedAlert.severity === 'high' 
                      ? 'bg-red-100 text-red-800' 
                      : selectedAlert.severity === 'medium'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {selectedAlert.severity === 'high' ? 'Alta' : 
                     selectedAlert.severity === 'medium' ? 'Média' : 'Baixa'}
                  </span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <div className="mt-1">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    selectedAlert.is_read 
                      ? 'bg-gray-100 text-gray-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {selectedAlert.is_read ? 'Lido' : 'Não lido'}
                  </span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Data de Criação</label>
                <p className="mt-1 text-sm text-gray-900">
                  {new Date(selectedAlert.created_at).toLocaleString('pt-BR')}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">ID do Alerta</label>
                <p className="mt-1 text-sm text-gray-500">#{selectedAlert.id}</p>
              </div>
              
              {selectedAlert.contract_id && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Contrato Relacionado</label>
                  <div className="mt-1">
                    <p className="text-sm text-gray-900">{selectedAlert.contract_name}</p>
                  </div>
                </div>
              )}
            </div>
            
            <div className="mt-6 flex justify-end">
              {selectedAlert.contract_id && (
                <button
                  onClick={() => {
                    // Salvar informações do contrato no localStorage antes de navegar
                    localStorage.setItem('highlightContract', selectedAlert.contract_id.toString())
                    localStorage.setItem('highlightContractName', selectedAlert.contract_name)
                    // Navegar para a página de contratos
                    window.location.href = '/contracts'
                    // Fechar modal
                    setShowAlertDetails(false)
                  }}
                  className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  Ir para Contrato
                </button>
              )}
              <button
                onClick={() => setShowAlertDetails(false)}
                className="ml-2 px-4 py-3 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
