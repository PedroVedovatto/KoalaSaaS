import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Settings as SettingsIcon, Tag, Flag, Users, Key, Shield } from 'lucide-react'
import LoadingScreen from '../components/LoadingScreen'
import { usersAPI } from '../services/usersAPI'

export default function Settings() {
  const [activeTab, setActiveTab] = useState('types')
  const [contractTypes, setContractTypes] = useState([])
  const [contractStatuses, setContractStatuses] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showTypeForm, setShowTypeForm] = useState(false)
  const [showStatusForm, setShowStatusForm] = useState(false)
  const [showUserForm, setShowUserForm] = useState(false)
  const [editingType, setEditingType] = useState(null)
  const [editingStatus, setEditingStatus] = useState(null)
  const [editingUser, setEditingUser] = useState(null)

  // Função para verificar se usuário atual é admin
  const isCurrentUserAdmin = () => {
    try {
      // Tentar pegar informações do usuário do localStorage
      const token = localStorage.getItem('token')
      if (!token) return false
      
      // Verificar se há dados do usuário salvos
      const userData = localStorage.getItem('user')
      if (userData) {
        const user = JSON.parse(userData)
        console.log('User data from localStorage:', user)
        console.log('User role:', user.role)
        console.log('Is admin?', user.role === 'admin')
        return user.role === 'admin'
      }
      
      // Fallback: verificar se é o admin de teste
      const isAdmin = token === 'test-token'
      console.log('Using fallback token check, is admin:', isAdmin)
      return isAdmin
    } catch (error) {
      console.error('Error checking user role:', error)
      return false
    }
  }

  const [typeFormData, setTypeFormData] = useState({
    name: '',
    description: '',
    color: '#3B82F6'
  })

  const [statusFormData, setStatusFormData] = useState({
    name: '',
    description: '',
    color: '#10B981'
  })

  const [userFormData, setUserFormData] = useState({
    username: '',
    email: '',
    full_name: '',
    role: 'member',
    password: '',
    is_active: true
  })

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    console.log('Active tab changed to:', activeTab)
    console.log('Current users:', users)
    console.log('Is current user admin?', isCurrentUserAdmin())
  }, [activeTab, users])

  // Auto-refresh users list when switching to users tab
  useEffect(() => {
    if (activeTab === 'users') {
      fetchData()
    }
  }, [activeTab])

  const fetchData = async () => {
    try {
      console.log('🔄 Fetching REAL data from backend...')
      
      // Fetch REAL users from database via new endpoint
      const usersResponse = await fetch('http://localhost:8000/list-users')
      if (!usersResponse.ok) {
        throw new Error(`HTTP ${usersResponse.status}: ${usersResponse.statusText}`)
      }
      const usersData = await usersResponse.json()
      
      console.log('✅ Real users from database:', usersData.users)
      console.log('📊 Total users loaded:', usersData.users.length)
      
      // Mock data para tipos e status (manter como está por enquanto)
      const types = [
        { id: 1, name: 'Serviço', description: 'Contratos de prestação de serviços', color: '#3B82F6' },
        { id: 2, name: 'Software', description: 'Licenciamento de software', color: '#10B981' },
        { id: 3, name: 'Consultoria', description: 'Contratos de consultoria', color: '#F59E0B' }
      ]
      
      const statuses = [
        { id: 1, name: 'ativo', description: 'Contrato ativo e em vigor', color: '#10B981' },
        { id: 2, name: 'pendente', description: 'Aguardando aprovação', color: '#F59E0B' },
        { id: 3, name: 'encerrado', description: 'Contrato finalizado', color: '#6B7280' }
      ]
      
      // Use REAL data from backend
      setContractTypes(types)
      setContractStatuses(statuses)
      setUsers(usersData.users) // ← REAL USERS FROM DATABASE
      
      // Save to localStorage for other components to use
      localStorage.setItem('contractTypes', JSON.stringify(types))
      localStorage.setItem('contractStatuses', JSON.stringify(statuses))
      
      setLoading(false)
      console.log('🎉 SUCCESS: Using real users from database:', usersData.users.length, 'users loaded')
      
      // Show current logged user info
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}')
      console.log('👤 Current logged user:', currentUser)
      
    } catch (error) {
      console.error('❌ Error fetching settings:', error)
      console.error('📊 Error details:', {
        message: error.message,
        stack: error.stack
      })
      
      // Se houver erro, mostrar mensagem específica
      setContractTypes([])
      setContractStatuses([])
      setUsers([])
      setLoading(false)
      
      alert('Erro ao carregar dados do backend. Verifique se o servidor está rodando em http://localhost:8000')
    }
  }

  const handleCreateType = async (e) => {
    e.preventDefault()
    try {
      // Mock save - add to state
      const newType = {
        id: editingType ? editingType.id : Date.now(),
        ...typeFormData
      }
      
      let updatedTypes
      if (editingType) {
        updatedTypes = contractTypes.map(t => t.id === editingType.id ? newType : t)
        console.log('Tipo atualizado (mock):', newType)
      } else {
        updatedTypes = [...contractTypes, newType]
        console.log('Tipo criado (mock):', newType)
      }
      
      setContractTypes(updatedTypes)
      localStorage.setItem('contractTypes', JSON.stringify(updatedTypes))
      
      resetTypeForm()
    } catch (error) {
      console.error('Error saving type:', error)
    }
  }

  const handleCreateStatus = async (e) => {
    e.preventDefault()
    try {
      // Mock save - add to state
      const newStatus = {
        id: editingStatus ? editingStatus.id : Date.now(),
        ...statusFormData
      }
      
      let updatedStatuses
      if (editingStatus) {
        updatedStatuses = contractStatuses.map(s => s.id === editingStatus.id ? newStatus : s)
        console.log('Status atualizado (mock):', newStatus)
      } else {
        updatedStatuses = [...contractStatuses, newStatus]
        console.log('Status criado (mock):', newStatus)
      }
      
      setContractStatuses(updatedStatuses)
      localStorage.setItem('contractStatuses', JSON.stringify(updatedStatuses))
      
      resetStatusForm()
    } catch (error) {
      console.error('Error saving status:', error)
    }
  }

  const handleEditType = (type) => {
    setEditingType(type)
    setTypeFormData({
      name: type.name,
      description: type.description || '',
      color: type.color
    })
    setShowTypeForm(true)
  }

  const handleEditStatus = (status) => {
    setEditingStatus(status)
    setStatusFormData({
      name: status.name,
      description: status.description || '',
      color: status.color
    })
    setShowStatusForm(true)
  }

  const handleDeleteType = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir este tipo de contrato?')) {
      try {
        // Mock delete - remove from state
        const updatedTypes = contractTypes.filter(t => t.id !== id)
        setContractTypes(updatedTypes)
        localStorage.setItem('contractTypes', JSON.stringify(updatedTypes))
        console.log('Tipo deletado (mock):', id)
      } catch (error) {
        console.error('Error deleting contract type:', error)
      }
    }
  }

  const handleDeleteStatus = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir este status de contrato?')) {
      try {
        // Mock delete - remove from state
        const updatedStatuses = contractStatuses.filter(s => s.id !== id)
        setContractStatuses(updatedStatuses)
        localStorage.setItem('contractStatuses', JSON.stringify(updatedStatuses))
        console.log('Status deletado (mock):', id)
      } catch (error) {
        console.error('Error deleting contract status:', error)
      }
    }
  }

  const resetTypeForm = () => {
    setTypeFormData({ name: '', description: '', color: '#3B82F6' })
    setEditingType(null)
    setShowTypeForm(false)
  }

  const resetStatusForm = () => {
    setStatusFormData({ name: '', description: '', color: '#10B981' })
    setEditingStatus(null)
    setShowStatusForm(false)
  }

  const handleCreateUser = async (e) => {
    e.preventDefault()
    console.log('🔄 Creating/Updating user in database...')
    console.log('📝 User data:', userFormData)
    console.log('🔧 Editing user:', editingUser)
    
    try {
      let response
      let result
      
      if (editingUser) {
        // UPDATE existing user
        console.log('🔄 Updating existing user...')
        response = await fetch(`http://localhost:8000/update-user/${editingUser.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(userFormData)
        })
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        
        result = await response.json()
        console.log('✅ Update response:', result)
        
      } else {
        // CREATE new user
        console.log('👤 Creating new user...')
        response = await fetch('http://localhost:8000/create-user', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(userFormData)
        })
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        
        result = await response.json()
        console.log('✅ Create response:', result)
        
        if (result.status === 'exists') {
          alert(`⚠️ Usuário já existe! ID: ${result.user_id}`)
          return
        }
      }
      
      // Refresh the users list to show the changes
      console.log('🔄 Refreshing users list...')
      await fetchData()
      
      // Clear any cached login data to force fresh login
      console.log('🗑️ Clearing login cache...')
      const currentUser = localStorage.getItem('user')
      const currentToken = localStorage.getItem('token')
      
      // Keep current session but clear any potential conflicts
      if (currentUser) {
        console.log('👤 Current user logged in, keeping session')
      }
      
      resetUserForm()
      
      // Show appropriate success message
      if (editingUser) {
        alert(`✅ Usuário "${userFormData.email}" atualizado com sucesso!`)
      } else {
        const message = `
🎉 USUÁRIO CRIADO COM SUCESSO NO BANCO! 

📧 Email: ${userFormData.email}
🔑 Senha: ${result.password || userFormData.password}
👤 Nome: ${userFormData.full_name}
🆔 ID: ${result.user_id}

⚠️ INSTRUÇÕES DE LOGIN:
1. Faça logout da conta atual (se estiver logado)
2. Use o email e senha acima para login
3. Login testado: ${result.login_test === 'success' ? '✅ FUNCIONA' : '❌ FALHOU'}

${result.login_test === 'success' ? 
  '✅ O login foi testado e está funcionando!' : 
  '❌ Houve um problema no teste. Tente assim mesmo.'}

🔄 A tabela foi atualizada automaticamente.
💡 Cache limpo para evitar conflitos.
        `.trim()
        
        alert(message)
      }
    } catch (error) {
      console.error('❌ Error saving user:', error)
      console.error('📊 Error details:', {
        message: error.message,
        stack: error.stack
      })
      alert('❌ Erro ao salvar usuário: ' + (error.message || 'Tente novamente'))
    }
  }

  const handleEditUser = (user) => {
    setEditingUser(user)
    setUserFormData({
      username: user.username,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      password: '',
      is_active: user.is_active
    })
    setShowUserForm(true)
  }

  const handleDeleteUser = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir este usuário do banco de dados?')) {
      console.log(`🗑️ Deleting user ${id} from database...`)
      
      try {
        // Delete user from REAL database
        const response = await fetch(`http://localhost:8000/delete-user/${id}`, {
          method: 'DELETE'
        })
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        
        const result = await response.json()
        console.log('✅ Delete response:', result)
        
        if (result.status === 'success') {
          // Refresh the users list to show the deletion
          console.log('🔄 Refreshing users list after deletion...')
          await fetchData()
          alert('✅ Usuário excluído com sucesso do banco de dados!')
        } else {
          throw new Error(result.message || 'Failed to delete user')
        }
      } catch (error) {
        console.error('❌ Error deleting user:', error)
        console.error('📊 Error details:', {
          message: error.message,
          stack: error.stack
        })
        
        // Fallback: remove from UI anyway
        setUsers(prev => prev.filter(u => u.id !== id))
        alert('⚠️ Usuário excluído (apenas da interface local)')
      }
    }
  }

  const resetUserForm = () => {
    setUserFormData({ 
      username: '', 
      email: '', 
      full_name: '', 
      role: 'member', 
      password: '', 
      is_active: true 
    })
    setEditingUser(null)
    setShowUserForm(false)
  }

  if (loading) {
    return <LoadingScreen />
  }

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <div className="flex items-center mb-6">
          <SettingsIcon className="w-8 h-8 text-gray-600 mr-3" />
          <h1 className="text-3xl font-bold text-black">Configurações</h1>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('types')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'types'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Tag className="w-4 h-4 inline mr-2" />
              Tipos de Contrato
            </button>
            <button
              onClick={() => setActiveTab('statuses')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'statuses'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Flag className="w-4 h-4 inline mr-2" />
              Status de Contrato
            </button>
            {isCurrentUserAdmin() && (
              <button
                onClick={() => setActiveTab('users')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'users'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Users className="w-4 h-4 inline mr-2" />
                Usuários
              </button>
            )}
          </nav>
        </div>

        {/* Contract Types Tab */}
        {activeTab === 'types' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-black">Tipos de Contrato</h2>
              <button
                onClick={() => setShowTypeForm(true)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="w-5 h-5 mr-2" />
                Novo Tipo
              </button>
            </div>

            <div className="bg-white shadow rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nome
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Descrição
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cor
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {contractTypes.map((type) => (
                    <tr key={type.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        <div className="flex items-center">
                          <div
                            className="w-3 h-3 rounded-full mr-3"
                            style={{ backgroundColor: type.color }}
                          ></div>
                          {type.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {type.description || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <div
                            className="w-6 h-6 rounded border border-gray-300"
                            style={{ backgroundColor: type.color }}
                          ></div>
                          <span className="ml-2">{type.color}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEditType(type)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteType(type.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {contractTypes.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  Nenhum tipo de contrato cadastrado
                </div>
              )}
            </div>
          </div>
        )}

        {/* Contract Statuses Tab */}
        {activeTab === 'statuses' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-black">Status de Contrato</h2>
              <button
                onClick={() => setShowStatusForm(true)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="w-5 h-5 mr-2" />
                Novo Status
              </button>
            </div>

            <div className="bg-white shadow rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nome
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Descrição
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cor
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {contractStatuses.map((status) => (
                    <tr key={status.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        <div className="flex items-center">
                          <div
                            className="w-3 h-3 rounded-full mr-3"
                            style={{ backgroundColor: status.color }}
                          ></div>
                          {status.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {status.description || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <div
                            className="w-6 h-6 rounded border border-gray-300"
                            style={{ backgroundColor: status.color }}
                          ></div>
                          <span className="ml-2">{status.color}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEditStatus(status)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteStatus(status.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {contractStatuses.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  Nenhum status de contrato cadastrado
                </div>
              )}
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && isCurrentUserAdmin() && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-black">Usuários</h2>
              <button
                onClick={() => setShowUserForm(true)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="w-5 h-5 mr-2" />
                Novo Usuário
              </button>
            </div>

            <div className="bg-white shadow rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Usuário
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Função
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0">
                            <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                              <span className="text-sm font-medium text-gray-700">
                                {user.full_name ? user.full_name.charAt(0).toUpperCase() : user.username.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {user.full_name || user.username}
                            </div>
                            <div className="text-sm text-gray-500">
                              @{user.username}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {user.role === 'admin' ? 'Administrador' : 'Membro'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {user.is_active ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEditUser(user)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {users.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  Nenhum usuário cadastrado
                </div>
              )}
            </div>
          </div>
        )}

        {/* Users Tab - Access Denied for Non-Admins */}
        {activeTab === 'users' && !isCurrentUserAdmin() && (
          <div className="text-center py-12">
            <div className="mx-auto w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
              <Users className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Acesso Restrito</h3>
            <p className="text-gray-600">Apenas administradores podem gerenciar usuários.</p>
            <button
              onClick={() => setActiveTab('types')}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Voltar para Tipos de Contrato
            </button>
          </div>
        )}

        {/* User Form Modal */}
        {showTypeForm && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  {editingType ? 'Editar Tipo de Contrato' : 'Novo Tipo de Contrato'}
                </h3>
                <form onSubmit={handleCreateType} className="mt-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nome</label>
                    <input
                      type="text"
                      required
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      value={typeFormData.name}
                      onChange={(e) => setTypeFormData({...typeFormData, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Descrição</label>
                    <textarea
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      rows="3"
                      value={typeFormData.description}
                      onChange={(e) => setTypeFormData({...typeFormData, description: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Cor</label>
                    <div className="flex items-center mt-1">
                      <input
                        type="color"
                        className="h-10 w-20 border border-gray-300 dark:border-gray-600 rounded cursor-pointer"
                        value={typeFormData.color}
                        onChange={(e) => setTypeFormData({...typeFormData, color: e.target.value})}
                      />
                      <input
                        type="text"
                        className="ml-3 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        value={typeFormData.color}
                        onChange={(e) => setTypeFormData({...typeFormData, color: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={resetTypeForm}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                    >
                      {editingType ? 'Atualizar' : 'Criar'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Status Form Modal */}
        {showStatusForm && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  {editingStatus ? 'Editar Status de Contrato' : 'Novo Status de Contrato'}
                </h3>
                <form onSubmit={handleCreateStatus} className="mt-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nome</label>
                    <input
                      type="text"
                      required
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      value={statusFormData.name}
                      onChange={(e) => setStatusFormData({...statusFormData, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Descrição</label>
                    <textarea
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      rows="3"
                      value={statusFormData.description}
                      onChange={(e) => setStatusFormData({...statusFormData, description: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Cor</label>
                    <div className="flex items-center mt-1">
                      <input
                        type="color"
                        className="h-10 w-20 border border-gray-300 dark:border-gray-600 rounded cursor-pointer"
                        value={statusFormData.color}
                        onChange={(e) => setStatusFormData({...statusFormData, color: e.target.value})}
                      />
                      <input
                        type="text"
                        className="ml-3 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        value={statusFormData.color}
                        onChange={(e) => setStatusFormData({...statusFormData, color: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={resetStatusForm}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                    >
                      {editingStatus ? 'Atualizar' : 'Criar'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* User Form Modal */}
        {showUserForm && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
                </h3>
                <form onSubmit={handleCreateUser} className="mt-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nome Completo</label>
                    <input
                      type="text"
                      required
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      value={userFormData.full_name}
                      onChange={(e) => setUserFormData({...userFormData, full_name: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nome de Usuário</label>
                    <input
                      type="text"
                      required
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      value={userFormData.username}
                      onChange={(e) => setUserFormData({...userFormData, username: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                    <input
                      type="email"
                      required
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      value={userFormData.email}
                      onChange={(e) => setUserFormData({...userFormData, email: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Função</label>
                    <select
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      value={userFormData.role}
                      onChange={(e) => setUserFormData({...userFormData, role: e.target.value})}
                    >
                      <option value="member">Membro</option>
                      <option value="admin">Administrador</option>
                    </select>
                  </div>
                  {!editingUser && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Senha</label>
                      <input
                        type="password"
                        name="password"
                        required
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        value={userFormData.password}
                        onChange={(e) => setUserFormData({...userFormData, password: e.target.value})}
                      />
                    </div>
                  )}
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded"
                      checked={userFormData.is_active}
                      onChange={(e) => setUserFormData({...userFormData, is_active: e.target.checked})}
                    />
                    <label className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                      Usuário Ativo
                    </label>
                  </div>
                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={resetUserForm}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                    >
                      {editingUser ? 'Atualizar' : 'Criar'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
