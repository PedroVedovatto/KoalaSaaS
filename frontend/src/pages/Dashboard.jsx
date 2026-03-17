import { useState, useEffect } from 'react'
import { Building2, FileText, AlertTriangle, TrendingUp, Calendar, DollarSign } from 'lucide-react'
import { contractsAPI } from '../services/api'

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [expiringContracts, setExpiringContracts] = useState([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsResponse, contractsResponse] = await Promise.all([
          contractsAPI.getDashboardStats(),
          contractsAPI.getContracts({ limit: 10 })
        ])
        
        setStats(statsResponse.data)
        setExpiringContracts(contractsResponse.data.filter(c => c.alert))
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Carregando dashboard...</div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="text-center text-gray-500">
        Erro ao carregar dados do dashboard
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Visão geral dos seus contratos e alertas</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total de Contratos</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.total_contracts}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Building2 className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Contratos Ativos</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.active_contracts}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Vencem em 30 dias</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.expiring_soon}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Valor Total</p>
              <p className="text-2xl font-semibold text-gray-900">
                R$ {stats.total_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Alertas Importantes</h2>
          <div className="space-y-3">
            {stats.expired > 0 && (
              <div className="flex items-center p-3 bg-red-50 border-l-4 border-red-500 rounded">
                <AlertTriangle className="w-5 h-5 text-red-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-red-800">
                    {stats.expired} contrato(s) expirado(s)
                  </p>
                  <p className="text-xs text-red-600">Verifique e renove ou cancele</p>
                </div>
              </div>
            )}
            
            {stats.expiring_soon > 0 && (
              <div className="flex items-center p-3 bg-yellow-50 border-l-4 border-yellow-500 rounded">
                <Calendar className="w-5 h-5 text-yellow-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">
                    {stats.expiring_soon} contrato(s) vencem em breve
                  </p>
                  <p className="text-xs text-yellow-600">Ação recomendada: planeje renovação</p>
                </div>
              </div>
            )}

            {stats.expired === 0 && stats.expiring_soon === 0 && (
              <div className="flex items-center p-3 bg-green-50 border-l-4 border-green-500 rounded">
                <TrendingUp className="w-5 h-5 text-green-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-green-800">
                    Sem alertas críticos
                  </p>
                  <p className="text-xs text-green-600">Todos os contratos estão em dia</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Economia Potencial</h2>
          <div className="text-center">
            <p className="text-3xl font-bold text-green-600">
              R$ {stats.potential_savings.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-sm text-gray-600 mt-2">
              Economia estimada evitando multas e atrasos
            </p>
          </div>
        </div>
      </div>

      {/* Recent Contracts with Alerts */}
      {expiringContracts.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Contratos Requerem Atenção</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contrato
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data de Vencimento
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Alerta
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {expiringContracts.map((contract) => (
                  <tr key={contract.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {contract.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {contract.contract_type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(contract.end_date).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                        {contract.alert}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
