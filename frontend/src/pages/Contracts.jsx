import { useState, useEffect } from 'react'
import { Plus, Search, FileText, Edit, Trash2, Calendar, DollarSign, AlertTriangle, Eye, AlertCircle, MoreVertical } from 'lucide-react'
import LoadingScreen from '../components/LoadingScreen'

export default function Contracts() {
  // Store for opened windows
  const [openedWindows, setOpenedWindows] = useState({})
  
  const [contracts, setContracts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingContract, setEditingContract] = useState(null)
  const [showDetails, setShowDetails] = useState(false)
  const [selectedContract, setSelectedContract] = useState(null)
  const [selectedContracts, setSelectedContracts] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterType, setFilterType] = useState('')
  const [error, setError] = useState(null)
  const [activeDropdown, setActiveDropdown] = useState(null)
  const [filterStatusDropdown, setFilterStatusDropdown] = useState(false)
  const [filterTypeDropdown, setFilterTypeDropdown] = useState(false)
  
  useEffect(() => {
    // Buscar tipos de contrato do backend também
    const fetchContractTypes = async () => {
      try {
        console.log('🔄 Fetching contract types from backend...')
        const response = await fetch('http://localhost:8000/public-contract-types')
        const data = await response.json()
        
        if (data.contract_types && data.contract_types.length > 0) {
          console.log('✅ Real contract types loaded:', data.contract_types.length)
          setContractTypes(data.contract_types)
        } else {
          console.log('⚠️ No contract types found in backend, using mock data')
        }
      } catch (error) {
        console.error('❌ Error fetching contract types:', error)
        console.log('📊 Using mock contract types as fallback')
      }
    }
    
    fetchContractTypes()
  }, [])
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (activeDropdown && !event.target.closest('.dropdown-container')) {
        setActiveDropdown(null)
      }
      if (filterStatusDropdown && !event.target.closest('.filter-status-dropdown')) {
        setFilterStatusDropdown(false)
      }
      if (filterTypeDropdown && !event.target.closest('.filter-type-dropdown')) {
        setFilterTypeDropdown(false)
      }
    }
    
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [activeDropdown, filterStatusDropdown, filterTypeDropdown])
  
  const [contractTypes, setContractTypes] = useState([])
  const [contractStatuses, setContractStatuses] = useState([
    { id: 1, name: 'ativo', description: 'Contrato ativo e em vigor', color: '#10B981' },
    { id: 2, name: 'pendente', description: 'Aguardando aprovação', color: '#F59E0B' },
    { id: 3, name: 'encerrado', description: 'Contrato finalizado', color: '#6B7280' }
  ])
  
  // Função para obter a cor do tipo de contrato
  const getContractTypeColor = (typeName) => {
    const type = contractTypes.find(t => t.name === typeName)
    return type ? type.color : '#6B7280' // Cor padrão cinza se não encontrar
  }
  const [formData, setFormData] = useState({
    name: '',
    contract_type: '',
    description: '',
    value: '',
    start_date: '',
    end_date: '',
    billing_cycle: 'onetime',
    cancel_days_before: 30,
    auto_renew: false
  })
  const [file, setFile] = useState(null)

  const fetchContracts = async () => {
    try {
      setError(null)
      
      // Verificar se há dados no localStorage primeiro
      const storedContracts = localStorage.getItem('contracts')
      let contracts = []
      
      if (storedContracts) {
        // Usar dados do localStorage temporariamente
        contracts = JSON.parse(storedContracts)
      }
      
      // Buscar dados reais do backend
      try {
        console.log('🔄 Fetching real contracts from backend...')
        const response = await fetch('http://localhost:8000/public-contracts')
        const data = await response.json()
        
        if (data.contracts && data.contracts.length > 0) {
          console.log('✅ Real contracts loaded:', data.contracts.length)
          
          // Add alert information based on days until expiration
          const today = new Date()
          const contractsWithAlerts = data.contracts.map(contract => {
            const endDate = new Date(contract.end_date)
            const daysUntil = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24))
            
            let alert = null
            if (daysUntil <= 0) {
              alert = 'Expirou'
            } else if (daysUntil <= 7) {
              alert = `Vence em ${daysUntil} dias`
            } else if (daysUntil <= 15) {
              alert = `Vence em ${daysUntil} dias`
            } else if (daysUntil <= 30) {
              alert = `Vence em ${daysUntil} dias`
            }
            
            return { ...contract, alert }
          })
          
          contracts = contractsWithAlerts
          // Salvar no localStorage
          localStorage.setItem('contracts', JSON.stringify(contracts))
        } else {
          console.log('⚠️ No contracts found in backend, using localStorage data')
        }
      } catch (error) {
        console.error('❌ Error fetching real contracts:', error)
        console.log('📊 Using localStorage data as fallback')
      }
      
      // Processar filtros e atualizar estado
      setTimeout(() => {
        let filtered = contracts
        if (searchTerm) {
          filtered = filtered.filter(c => 
            c.name.toLowerCase().includes(searchTerm.toLowerCase())
          )
        }
        if (filterStatus) {
          filtered = filtered.filter(c => c.status === filterStatus)
        }
        if (filterType) {
          filtered = filtered.filter(c => c.contract_type === filterType)
        }
        
        setContracts(filtered)
        setLoading(false)
      }, 2000)
      
    } catch (error) {
      console.error('Error fetching contracts:', error)
      setError('Falha ao carregar contratos')
      setContracts([])
      setLoading(false)
    }
  }

  // Garantir loading inicial de 3 segundos
  useEffect(() => {
    setLoading(true)
    const timer = setTimeout(() => {
      setLoading(false)
    }, 3000)
    
    return () => clearTimeout(timer)
  }, [])

  // Verificar se há contrato para destacar (vindo do alerta)
  useEffect(() => {
    const highlightContractId = localStorage.getItem('highlightContract')
    const highlightContractName = localStorage.getItem('highlightContractName')
    
    if (highlightContractId && highlightContractName && contracts.length > 0) {
      // Encontrar o contrato na lista
      const contract = contracts.find(c => c.id === parseInt(highlightContractId))
      
      if (contract) {
        // Remover destaque anterior
        document.querySelectorAll('.highlight-contract').forEach(el => {
          el.classList.remove('highlight-contract')
        })
        
        // Adicionar destaque ao contrato encontrado
        setTimeout(() => {
          const contractRow = document.querySelector(`[data-contract-id="${contract.id}"]`)
          if (contractRow) {
            contractRow.classList.add('highlight-contract')
            // Scroll suave e natural para o centro da tela
            contractRow.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'center',
              inline: 'nearest'
            })
            
            // Remover destaque após 3 segundos
            setTimeout(() => {
              contractRow.classList.remove('highlight-contract')
            }, 3000)
          }
        }, 300)
      }
      
      // Limpar localStorage
      localStorage.removeItem('highlightContract')
      localStorage.removeItem('highlightContractName')
    }
  }, [contracts])

  useEffect(() => {
    fetchContracts()
  }, [searchTerm, filterStatus, filterType])

  useEffect(() => {
    setLoading(true)
    fetchContracts()
    
    // Load contract types and statuses from Settings (stored in localStorage)
    const loadSettingsData = () => {
      try {
        const savedTypes = localStorage.getItem('contractTypes')
        const savedStatuses = localStorage.getItem('contractStatuses')
        
        if (savedTypes) {
          setContractTypes(JSON.parse(savedTypes))
        }
        
        if (savedStatuses) {
          setContractStatuses(JSON.parse(savedStatuses))
        }
      } catch (error) {
        console.error('Error loading settings data:', error)
      }
    }
    
    loadSettingsData()
  }, [])

  const clearSearch = () => {
    setSearchTerm('')
    setFilterStatus('')
    setFilterType('')
    fetchContracts()
  }

  const handleViewDetails = (contract) => {
    setSelectedContract(contract)
    setShowDetails(true)
  }

  const handleSelectContract = (contractId) => {
    setSelectedContracts(prev => {
      if (prev.includes(contractId)) {
        return prev.filter(id => id !== contractId)
      } else {
        return [...prev, contractId]
      }
    })
  }

  const toggleDropdown = (contractId) => {
    setActiveDropdown(activeDropdown === contractId ? null : contractId)
  }

  const handleClickOutside = () => {
    setActiveDropdown(null)
  }

  const toggleFilterStatusDropdown = () => {
    setFilterStatusDropdown(!filterStatusDropdown)
    setFilterTypeDropdown(false)
  }

  const toggleFilterTypeDropdown = () => {
    setFilterTypeDropdown(!filterTypeDropdown)
    setFilterStatusDropdown(false)
  }

  const handleStatusSelect = (status) => {
    setFilterStatus(status)
    setFilterStatusDropdown(false)
  }

  const handleTypeSelect = (type) => {
    setFilterType(type)
    setFilterTypeDropdown(false)
  }

  const handleSelectAll = () => {
    if (selectedContracts.length === contracts.length) {
      setSelectedContracts([])
    } else {
      // Seleciona todos os contratos
      setSelectedContracts(contracts.map(c => c.id))
    }
  }

  const handleMultiDelete = async () => {
    if (selectedContracts.length === 0) return
    
    const message = selectedContracts.length === 1 
      ? 'Tem certeza que deseja excluir este contrato?'
      : `Tem certeza que deseja excluir ${selectedContracts.length} contratos?`
    
    if (window.confirm(message)) {
      try {
        setError(null)
        
        // Obter contratos atuais do localStorage
        const storedContracts = localStorage.getItem('contracts')
        let currentContracts = storedContracts ? JSON.parse(storedContracts) : []
        
        // Remover os contratos selecionados
        const updatedContracts = currentContracts.filter(c => !selectedContracts.includes(c.id))
        
        // Salvar no localStorage
        localStorage.setItem('contracts', JSON.stringify(updatedContracts))
        setContracts(updatedContracts)
        setSelectedContracts([])
        
        console.log('Contratos deletados:', selectedContracts.length)
        
      } catch (error) {
        console.error('Error deleting contracts:', error)
        setError('Falha ao excluir contratos')
      }
    }
  }

  const handleMultiView = () => {
    if (selectedContracts.length === 0) return
    
    // Abre múltiplas abas com detalhes
    selectedContracts.forEach((id, index) => {
      const contract = contracts.find(c => c.id === id)
      if (contract) {
        // Fecha janela anterior se existir - VERIFICAÇÃO IMEDIATA
        if (openedWindows[id]) {
          console.log(`Fechando janela existente: ${contract.name} (ID: ${id})`)
          try {
            openedWindows[id].close()
            // Remove imediatamente do estado
            setOpenedWindows(prev => {
              const newOpened = { ...prev }
              delete newOpened[id]
              return newOpened
            })
          } catch (error) {
            console.log(`Erro ao fechar janela existente: ${error}`)
          }
        }
        
        // Abre cada janela com um delay para garantir que todas abram
        setTimeout(() => {
          // Gera timestamp único e nome de janela diferente
          const uniqueId = Date.now() + Math.random() * 1000000 + index
          const windowName = `contract_${id}_${uniqueId}`
          const windowFeatures = 'width=700,height=900,scrollbars=yes,resizable=yes'
          
          // Tenta abrir janela
          try {
            const newWindow = window.open('', windowName, windowFeatures)
            
            if (newWindow) {
              // Armazena a referência da janela aberta imediatamente
              setOpenedWindows(prev => ({
                ...prev,
                [id]: newWindow
              }))
              
              // Adiciona evento para limpar quando a janela fechar
              newWindow.addEventListener('beforeunload', () => {
                console.log(`Janela fechada pelo usuário: ${contract.name} (ID: ${id})`)
                setOpenedWindows(prev => {
                  const newOpened = { ...prev }
                  delete newOpened[id]
                  return newOpened
                })
              })
              
              // Adiciona evento para detectar fechamento programático
              newWindow.addEventListener('unload', () => {
                console.log(`Janela descarregada: ${contract.name} (ID: ${id})`)
                setOpenedWindows(prev => {
                  const newOpened = { ...prev }
                  delete newOpened[id]
                  return newOpened
                })
              })
              
              const htmlContent = `
                <html>
                  <head>
                    <title>${contract.name} - Detalhes</title>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <style>
                      * {
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                      }
                      body { 
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; 
                        background: linear-gradient(135deg, #f6f6f6 0%, #f3f3f3 100%);
                        min-height: 100vh;
                        padding: 20px;
                        color: #1a202c;
                      }
                      .container {
                        max-width: 700px;
                        margin: 0 auto;
                        background: rgba(255, 255, 255, 0.95);
                        backdrop-filter: blur(10px);
                        padding: 32px;
                        border-radius: 16px;
                        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
                      }
                      .header {
                        text-align: center;
                        margin-bottom: 32px;
                        padding-bottom: 24px;
                        border-bottom: 2px solid #e2e8f0;
                      }
                      .header h1 {
                        font-size: 28px;
                        font-weight: 700;
                        color: #2d3748;
                        margin-bottom: 8px;
                      }
                      .header p {
                        color: #718096;
                        font-size: 16px;
                      }
                      .grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                        gap: 24px;
                        margin-bottom: 32px;
                      }
                      .field-group {
                        background: #f7fafc;
                        padding: 20px;
                        border-radius: 12px;
                        border: 1px solid #e2e8f0;
                      }
                      .field {
                        margin-bottom: 16px;
                      }
                      .field:last-child {
                        margin-bottom: 0;
                      }
                      .label { 
                        font-weight: 600; 
                        color: #4a5568; 
                        font-size: 14px;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                        display: block;
                        margin-bottom: 6px;
                      }
                      .value { 
                        color: #2d3748; 
                        font-size: 16px;
                        font-weight: 500;
                      }
                      .status {
                        display: inline-block;
                        padding: 6px 16px;
                        border-radius: 20px;
                        font-size: 13px;
                        font-weight: 600;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                      }
                      .status.ativo { 
                        background: linear-gradient(135deg, #48bb78, #38a169); 
                        color: white;
                      }
                      .status.encerrado { 
                        background: linear-gradient(135deg, #a0aec0, #718096); 
                        color: white;
                      }
                      .status.cancelado { 
                        background: linear-gradient(135deg, #fc8181, #f56565); 
                        color: white;
                      }
                      .alert { 
                        background: linear-gradient(135deg, #f6e05e, #ecc94b);
                        color: #744210;
                        padding: 12px 16px;
                        border-radius: 8px;
                        font-weight: 500;
                        border-left: 4px solid #d69e2e;
                      }
                      .file-section {
                        margin-top: 32px;
                        padding-top: 32px;
                        border-top: 2px solid #e2e8f0;
                      }
                      .file-title {
                        font-size: 20px;
                        font-weight: 600;
                        color: #2d3748;
                        margin-bottom: 20px;
                        text-align: center;
                      }
                      .file-preview {
                        background: #f8fafc;
                        border: 2px solid #e2e8f0;
                        border-radius: 12px;
                        padding: 20px;
                        margin-bottom: 20px;
                        text-align: center;
                      }
                      .file-preview img {
                        max-width: 100%;
                        max-height: 350px;
                        border-radius: 8px;
                        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                      }
                      .file-preview iframe {
                        width: 100%;
                        height: 450px;
                        border: none;
                        border-radius: 8px;
                      }
                      .file-actions {
                        display: flex;
                        gap: 12px;
                        justify-content: flex-end;  
                        align-items: center;         
                        margin-top: 12px;
                        width: 100%;                
                      }
                      .btn {
                        padding: 12px 24px;
                        border-radius: 8px;
                        font-size: 15px;
                        font-weight: 600;
                        text-decoration: none;
                        cursor: pointer;
                        border: none;
                        display: inline-flex;
                        align-items: center;
                        justify-content: center;
                        min-width: 120px;
                        transition: all 0.3s ease;
                        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                      }
                      .btn:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
                      }
                      .btn-primary {
                        background: linear-gradient(135deg, #4299e1, #3182ce);
                        color: white;
                      }
                      .btn-primary:hover {
                        background: linear-gradient(135deg, #3182ce, #2c5282);
                      }
                      .btn-secondary {
                        background: linear-gradient(135deg, #48bb78, #38a169);
                        color: white;
                      }
                      .btn-secondary:hover {
                        background: linear-gradient(135deg, #38a169, #2f855a);
                      }
                      .no-file {
                        text-align: center;
                        padding: 40px;
                        color: #718096;
                        font-size: 16px;
                      }
                      .no-file-icon {
                        font-size: 48px;
                        margin-bottom: 16px;
                        opacity: 0.5;
                      }
                      @media (max-width: 768px) {
                        .container {
                          padding: 20px;
                          margin: 10px;
                        }
                        .grid {
                          grid-template-columns: 1fr;
                        }
                        .file-actions {
                          flex-direction: column;
                        }
                        .btn {
                          width: 100%;
                        }
                      }
                    </style>
                  </head>
                  <body>
                    <div class="container">
                      <div class="header">
                        <h1>Detalhes do Contrato</h1>
                        <p>${contract.name}</p>
                      </div>
                      
                      <div class="grid">
                        <div class="field-group">
                          <div class="field">
                            <span class="label">Tipo</span>
                            <span class="value">${contract.contract_type}</span>
                          </div>
                          <div class="field">
                            <span class="label">Valor</span>
                            <span class="value">R$ ${contract.value?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}</span>
                          </div>
                          <div class="field">
                            <span class="label">Ciclo</span>
                            <span class="value">${
                              contract.billing_cycle === 'onetime' ? 'Único' :
                              contract.billing_cycle === 'monthly' ? 'Mensal' :
                              contract.billing_cycle === 'quarterly' ? 'Trimestral' :
                              contract.billing_cycle === 'yearly' ? 'Anual' : '-'
                            }</span>
                          </div>
                          <div class="field">
                            <span class="label">Status</span>
                            <span class="value">
                              <span class="status ${contract.status}">${contract.status}</span>
                            </span>
                          </div>
                        </div>
                        
                        <div class="field-group">
                          <div class="field">
                            <span class="label">Início</span>
                            <span class="value">${new Date(contract.start_date).toLocaleDateString('pt-BR')}</span>
                          </div>
                          <div class="field">
                            <span class="label">Fim</span>
                            <span class="value">${new Date(contract.end_date).toLocaleDateString('pt-BR')}</span>
                          </div>
                          <div class="field">
                            <span class="label">Dias para Cancelar</span>
                            <span class="value">${contract.cancel_days_before} dias</span>
                          </div>
                          <div class="field">
                            <span class="label">Renovação Automática</span>
                            <span class="value">${contract.auto_renew ? 'Sim' : 'Não'}</span>
                          </div>
                        </div>
                      </div>
                      
                      ${contract.description ? `
                        <div class="field-group">
                          <div class="field">
                            <span class="label">Descrição</span>
                            <span class="value">${contract.description}</span>
                          </div>
                        </div>
                      ` : ''}
                      
                      ${contract.alert ? `
                        <div class="alert">
                          ${contract.alert}
                        </div>
                      ` : ''}
                      
                      <div class="field-group">
                        <div class="field">
                          <span class="label">Criado em</span>
                          <span class="value">${new Date(contract.created_at).toLocaleDateString('pt-BR')}</span>
                        </div>
                      </div>
                      
                      ${contract.file_path ? `
                        <div class="file-section">
                          <h2 class="file-title">Arquivo do Contrato</h2>
                          <div class="file-preview">
                            ${contract.file_path.toLowerCase().endsWith('.pdf') ? 
                              `<iframe src="http://localhost:8000/${contract.file_path}"></iframe>` :
                              (contract.file_path.toLowerCase().match(/\.(jpg|jpeg|png)$/i) ?
                                `<img src="http://localhost:8000/${contract.file_path}" alt="Preview do arquivo" />` :
                                `<div>
                                  <div class="no-file-icon">📄</div>
                                  <div>${contract.file_path.split('/').pop()}</div>
                                  <div style="font-size: 14px; margin-top: 8px; opacity: 0.7;">Tipo de arquivo não suportado para pré-visualização</div>
                                </div>`
                              )
                            }
                          </div>
                          <div class="file-actions">
                            <a href="http://localhost:8000/${contract.file_path}" target="_blank" class="btn btn-primary">
                              Abrir
                            </a>
                            <a href="http://localhost:8000/${contract.file_path}" download="${contract.file_path.split('/').pop()}" class="btn btn-secondary">
                              Salvar
                            </a>
                          </div>
                        </div>
                      ` : `
                        <div class="file-section">
                          <h2 class="file-title">Arquivo do Contrato</h2>
                          <div class="no-file">
                            <div class="no-file-icon">📄</div>
                            <div>Nenhum arquivo anexado a este contrato</div>
                          </div>
                        </div>
                      `}
                    </div>
                  </body>
                </html>
              `
              
              newWindow.document.write(htmlContent)
              newWindow.document.close()
              
              // Auto-close after 2 minutes if window is in background
              let isActive = true
              let closeTimer = null
              
              const startCloseTimer = () => {
                if (closeTimer) clearTimeout(closeTimer)
                closeTimer = setTimeout(() => {
                  if (!isActive && !newWindow.closed) {
                    console.log(`Fechando janela por inatividade: ${contract.name} (ID: ${id})`)
                    newWindow.close()
                    // Remove do estado quando fechar automaticamente
                    setOpenedWindows(prev => {
                      const newOpened = { ...prev }
                      delete newOpened[id]
                      return newOpened
                    })
                  }
                }, 120000) // 2 minutes = 120000ms
              }
              
              // Track window focus/blur
              const handleBlur = () => {
                isActive = false
                startCloseTimer()
              }
              
              const handleFocus = () => {
                isActive = true
                if (closeTimer) {
                  clearTimeout(closeTimer)
                  closeTimer = null
                }
              }
              
              // Add event listeners
              newWindow.addEventListener('blur', handleBlur)
              newWindow.addEventListener('focus', handleFocus)
              
              // Also handle page visibility changes
              const visibilityHandler = () => {
                if (newWindow.document.hidden) {
                  isActive = false
                  startCloseTimer()
                } else {
                  isActive = true
                  if (closeTimer) {
                    clearTimeout(closeTimer)
                    closeTimer = null
                  }
                }
              }
              
              if (newWindow.document.addEventListener) {
                newWindow.document.addEventListener('visibilitychange', visibilityHandler)
              }
              
              // Força o foco
              setTimeout(() => {
                newWindow.focus()
              }, 100)
              
              console.log(`Nova janela aberta: ${contract.name} (ID: ${id})`)
            } else {
              console.error(`Falha ao abrir janela para contrato: ${contract.name}`)
            }
          } catch (error) {
            console.error(`Erro ao abrir janela para contrato ${contract.name}:`, error)
          }
        }, index * 800) // Reduzido para 800ms entre cada janela
      }
    })
  }

  const isContractSelected = (contractId) => selectedContracts.includes(contractId)
  const canEdit = selectedContracts.length === 1
  const canDelete = selectedContracts.length >= 1
  const canView = selectedContracts.length >= 1

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.name || !formData.contract_type || !formData.start_date || !formData.end_date) {
      alert('Preencha todos os campos obrigatórios')
      return
    }
    
    try {
      setError(null)
      
      // Obter contratos atuais do localStorage
      const storedContracts = localStorage.getItem('contracts')
      let currentContracts = storedContracts ? JSON.parse(storedContracts) : []
      
      const newContract = {
        id: editingContract ? editingContract.id : Date.now(),
        ...formData,
        value: parseFloat(formData.value) || 0,
        status: editingContract ? formData.status : 'pendente', // Novos contratos sempre pendentes
        alert: editingContract ? formData.alert : 'Aguardando aprovação' // Novos contratos com alerta padrão
      }
      
      let updatedContracts
      if (editingContract) {
        updatedContracts = currentContracts.map(c => c.id === editingContract.id ? newContract : c)
        console.log('Contrato atualizado:', newContract)
      } else {
        updatedContracts = [...currentContracts, newContract]
        console.log('Contrato criado:', newContract)
      }
      
      // Salvar no localStorage
      localStorage.setItem('contracts', JSON.stringify(updatedContracts))
      setContracts(updatedContracts)
      
      resetForm()
      setShowForm(false)
      
    } catch (error) {
      console.error('Error saving contract:', error)
      setError('Falha ao salvar contrato')
    }
  }

  const handleEdit = (contract) => {
    setEditingContract(contract)
    setFormData({
      name: contract.name,
      contract_type: contract.contract_type,
      description: contract.description || '',
      value: contract.value || '',
      start_date: contract.start_date,
      end_date: contract.end_date,
      billing_cycle: contract.billing_cycle || 'onetime',
      cancel_days_before: contract.cancel_days_before || 30,
      auto_renew: contract.auto_renew || false
    })
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir este contrato?')) {
      return
    }

    try {
      setError(null)
      
      // Obter contratos atuais do localStorage
      const storedContracts = localStorage.getItem('contracts')
      let currentContracts = storedContracts ? JSON.parse(storedContracts) : []
      
      // Remover o contrato
      const updatedContracts = currentContracts.filter(c => c.id !== id)
      
      // Salvar no localStorage
      localStorage.setItem('contracts', JSON.stringify(updatedContracts))
      setContracts(updatedContracts)
      
      console.log('Contrato deletado:', id)
      
    } catch (error) {
      console.error('Error deleting contract:', error)
      setError('Falha ao excluir contrato')
    }
  }

  const handleApprove = async (contract) => {
    if (!window.confirm(`Tem certeza que deseja aprovar o contrato "${contract.name}"?`)) {
      return
    }

    try {
      setError(null)
      
      // Obter contratos atuais do localStorage
      const storedContracts = localStorage.getItem('contracts')
      let currentContracts = storedContracts ? JSON.parse(storedContracts) : []
      
      // Atualizar status do contrato
      const updatedContracts = currentContracts.map(c => 
        c.id === contract.id 
          ? { ...c, status: 'ativo', alert: null }
          : c
      )
      
      // Salvar no localStorage
      localStorage.setItem('contracts', JSON.stringify(updatedContracts))
      setContracts(updatedContracts)
      
      console.log('Contrato aprovado:', contract)
      
    } catch (error) {
      console.error('Error approving contract:', error)
      setError('Falha ao aprovar contrato')
    }
  }

  const handleFinish = async (contract) => {
    if (!window.confirm(`Tem certeza que deseja finalizar o contrato "${contract.name}"?`)) {
      return
    }

    try {
      setError(null)
      
      // Obter contratos atuais do localStorage
      const storedContracts = localStorage.getItem('contracts')
      let currentContracts = storedContracts ? JSON.parse(storedContracts) : []
      
      // Atualizar status do contrato
      const updatedContracts = currentContracts.map(c => 
        c.id === contract.id 
          ? { ...c, status: 'encerrado', alert: 'Contrato finalizado' }
          : c
      )
      
      // Salvar no localStorage
      localStorage.setItem('contracts', JSON.stringify(updatedContracts))
      setContracts(updatedContracts)
      
      console.log('Contrato finalizado:', contract)
      
    } catch (error) {
      console.error('Error finishing contract:', error)
      setError('Falha ao finalizar contrato')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      contract_type: '',
      description: '',
      value: '',
      start_date: '',
      end_date: '',
      billing_cycle: 'onetime',
      cancel_days_before: 30,
      auto_renew: false
    })
    setFile(null)
    setEditingContract(null)
    setShowForm(false)
  }

  if (loading) {
    return <LoadingScreen />
  }

  if (error) {
    return (
      <div className="text-center text-gray-500">
        <div className="mb-4">{error}</div>
        <button 
          onClick={() => fetchContracts()} 
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 mr-2"
        >
          Tentar novamente
        </button>
        <button 
          onClick={() => setError(null)} 
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          Limpar erro
        </button>
      </div>
    )
  }

  return (
    <div>
      {loading && <LoadingScreen />}
      <div className="space-y-6 relative">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contratos</h1>
          <p className="text-gray-600">Gerencie todos os seus contratos e documentos</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center px-4 py-2 bg-blue-950/80 text-white rounded-lg hover:bg-blue-950/90"
        >
          <Plus className="w-5 h-5 mr-2" />
          Novo Contrato
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        {/* Basic Search */}
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar por título ou descrição..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-sans"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <button
            onClick={clearSearch}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Limpar Filtros
          </button>
        </div>

        {/* Quick Filters */}
        <div className="flex gap-2">
          <div className="relative filter-status-dropdown filter-dropdown">
            <button
              onClick={toggleFilterStatusDropdown}
              className="flex items-center justify-start px-3 py-2 bg-white border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
            >
              {filterStatus || 'Todos os status'}
              <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {filterStatusDropdown && (
              <div className="absolute z-10 mt-1 bg-white rounded-md shadow-lg border border-gray-200">
                <div className="py-1">
                  <button
                    onClick={() => handleStatusSelect('')}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Todos os status
                  </button>
                  {contractStatuses.map(status => (
                    <button
                      key={status.id}
                      onClick={() => handleStatusSelect(status.name)}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      {status.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="relative filter-type-dropdown filter-dropdown">
            <button
              onClick={toggleFilterTypeDropdown}
              className="flex items-center justify-start px-3 py-2 bg-white border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
            >
              {filterType || 'Todos os tipos'}
              <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {filterTypeDropdown && (
              <div className="absolute z-10 mt-1 bg-white rounded-md shadow-lg border border-gray-200">
                <div className="py-1">
                  <button
                    onClick={() => handleTypeSelect('')}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Todos os tipos
                  </button>
                  {contractTypes.map(type => (
                    <button
                      key={type.id}
                      onClick={() => handleTypeSelect(type.name)}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      {type.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Contracts Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          {contracts.length === 0 ? (
          <div className="p-10 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-gray-900">Nenhum contrato cadastrado</h3>
            <p className="mt-1 text-sm text-gray-600">Clique em "Novo Contrato" para cadastrar o primeiro.</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    checked={selectedContracts.length === contracts.length && contracts.length > 0}
                    onChange={handleSelectAll}
                  />
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contrato
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valor
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vigência
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {contracts.map((contract) => (
                <tr key={contract.id} data-contract-id={contract.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={isContractSelected(contract.id)}
                      onChange={() => handleSelectContract(contract.id)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <FileText className="w-5 h-5 text-gray-400 mr-3" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">{contract.name}</div>
                        {contract.alert && (
                          <div className="text-xs text-orange-600 font-medium mt-1 flex items-center">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            {contract.alert}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap type-column">
                    <span 
                      className="px-2 py-1 text-xs font-medium rounded-full"
                      style={{ 
                        backgroundColor: getContractTypeColor(contract.contract_type) + '20',
                        color: getContractTypeColor(contract.contract_type)
                      }}
                    >
                      {contract.contract_type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {contract.value ? `R$ ${contract.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                      {new Date(contract.end_date).toLocaleDateString('pt-BR')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap status-column">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      contract.status === 'ativo' ? 'bg-green-100 text-green-800' :
                      contract.status === 'encerrado' ? 'bg-gray-100 text-gray-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {contract.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium relative">
                    <div className="relative dropdown-container">
                      <button
                        onClick={() => toggleDropdown(contract.id)}
                        className="text-gray-600 hover:text-gray-900 p-1 rounded hover:bg-gray-100"
                        title="Ações"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      
                      {activeDropdown === contract.id && (
                        <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                          <div className="py-1">
                            <button
                              onClick={() => {
                                handleViewDetails(contract)
                                toggleDropdown(contract.id)
                              }}
                              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              Ver Detalhes
                            </button>
                            <button
                              onClick={() => {
                                handleEdit(contract)
                                toggleDropdown(contract.id)
                              }}
                              className="flex items-center px-4 py-2 text-sm text-blue-600 hover:bg-gray-100 w-full text-left"
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Editar
                            </button>
                            {contract.status === 'pendente' && (
                              <>
                                <button
                                  onClick={() => {
                                    handleApprove(contract)
                                    toggleDropdown(contract.id)
                                  }}
                                  className="flex items-center px-4 py-2 text-sm text-green-600 hover:bg-gray-100 w-full text-left"
                                >
                                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                  Aprovar Contrato
                                </button>
                                <button
                                  onClick={() => {
                                    handleFinish(contract)
                                    toggleDropdown(contract.id)
                                  }}
                                  className="flex items-center px-4 py-2 text-sm text-purple-600 hover:bg-gray-100 w-full text-left"
                                >
                                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  Finalizar Contrato
                                </button>
                              </>
                            )}
                            {contract.status === 'ativo' && (
                              <button
                                onClick={() => {
                                  handleFinish(contract)
                                  toggleDropdown(contract.id)
                                }}
                                className="flex items-center px-4 py-2 text-sm text-purple-600 hover:bg-gray-100 w-full text-left"
                              >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Encerrar Contrato
                              </button>
                            )}
                            <button
                              onClick={() => {
                                handleDelete(contract.id)
                                toggleDropdown(contract.id)
                              }}
                              className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100 w-full text-left"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Excluir
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900">
                {editingContract ? 'Editar Contrato' : 'Novo Contrato'}
              </h3>
              <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nome</label>
                  <input
                    type="text"
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tipo</label>
                  <select
                    required
                    className="mt-1 custom-select"
                    value={formData.contract_type}
                    onChange={(e) => setFormData({...formData, contract_type: e.target.value})}
                  >
                    <option value="">Selecione</option>
                    {contractTypes.map(type => (
                      <option key={type.id} value={type.name}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Descrição</label>
                  <textarea
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    rows="3"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Valor</label>
                  <input
                    type="number"
                    step="0.01"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={formData.value}
                    onChange={(e) => setFormData({...formData, value: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Data Início</label>
                    <input
                      type="date"
                      required
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      value={formData.start_date}
                      onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Data Fim</label>
                    <input
                      type="date"
                      required
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      value={formData.end_date}
                      onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Ciclo de Cobrança</label>
                    <select
                      className="mt-1 custom-select"
                      value={formData.billing_cycle || 'onetime'}
                      onChange={(e) => setFormData({...formData, billing_cycle: e.target.value})}
                    >
                      <option value="onetime">Único</option>
                      <option value="monthly">Mensal</option>
                      <option value="quarterly">Trimestral</option>
                      <option value="yearly">Anual</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Dias para Cancelamento</label>
                    <input
                      type="number"
                      min="1"
                      max="365"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      value={formData.cancel_days_before || 30}
                      onChange={(e) => setFormData({...formData, cancel_days_before: parseInt(e.target.value)})}
                    />
                  </div>
                </div>

                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                      checked={formData.auto_renew}
                      onChange={(e) => setFormData({...formData, auto_renew: e.target.checked})}
                    />
                    <span className="ml-2 text-sm text-gray-700">Renovação automática</span>
                  </label>
                </div>

                {!editingContract && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Arquivo</label>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      onChange={(e) => setFile(e.target.files[0])}
                    />
                  </div>
                )}

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  >
                    {editingContract ? 'Atualizar' : 'Criar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetails && selectedContract && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-[600px] max-w-[90vw] shadow-lg rounded-md bg-white max-h-[80vh] overflow-y-auto">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Detalhes do Contrato</h3>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="sr-only">Fechar</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4 pb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nome</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedContract.name}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tipo</label>
                  <p className="mt-1">
                    <span 
                      className="px-2 py-1 rounded-full text-xs font-medium"
                      style={{ 
                        backgroundColor: getContractTypeColor(selectedContract.contract_type) + '20',
                        color: getContractTypeColor(selectedContract.contract_type)
                      }}
                    >
                      {selectedContract.contract_type}
                    </span>
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Descrição</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedContract.description || '-'}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Valor</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedContract.value ? `R$ ${selectedContract.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '-'}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Ciclo de Cobrança</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedContract.billing_cycle === 'onetime' ? 'Único' :
                     selectedContract.billing_cycle === 'monthly' ? 'Mensal' :
                     selectedContract.billing_cycle === 'quarterly' ? 'Trimestral' :
                     selectedContract.billing_cycle === 'yearly' ? 'Anual' : '-'}
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Data Início</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {new Date(selectedContract.start_date).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Data Fim</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {new Date(selectedContract.end_date).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <span className={`mt-1 inline-flex px-2 py-1 text-xs leading-5 font-semibold rounded-full ${
                      selectedContract.status === 'ativo' ? 'bg-green-100 text-green-800' :
                      selectedContract.status === 'encerrado' ? 'bg-gray-100 text-gray-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {selectedContract.status}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Renovação Automática</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {selectedContract.auto_renew ? 'Sim' : 'Não'}
                    </p>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Dias para Cancelamento</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedContract.cancel_days_before} dias</p>
                </div>
                
                {selectedContract.alert && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Alerta</label>
                    <p className="mt-1 text-sm text-orange-600">{selectedContract.alert}</p>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Arquivo do Contrato</label>
                  {selectedContract.file_path ? (
                    <div className="mt-2">
                      <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center flex-1 min-w-0">
                            <FileText className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" />
                            <span className="text-sm text-gray-700 truncate">
                              {selectedContract.file_path.split('/').pop()}
                            </span>
                          </div>
                          <div className="flex space-x-2 flex-shrink-0 ml-4">
                            <button
                              onClick={() => window.open(`http://localhost:8000/${selectedContract.file_path}`, '_blank')}
                              className="px-3 py-2 text-blue-600 hover:text-blue-800 text-sm font-medium bg-white border border-blue-200 rounded-md hover:bg-blue-50 transition-colors"
                            >
                              Visualizar
                            </button>
                            <button
                              onClick={() => {
                                const link = document.createElement('a')
                                link.href = `http://localhost:8000/${selectedContract.file_path}`
                                link.download = selectedContract.file_path.split('/').pop()
                                link.click()
                              }}
                              className="px-3 py-2 text-green-600 hover:text-green-800 text-sm font-medium bg-white border border-green-200 rounded-md hover:bg-green-50 transition-colors"
                            >
                              Baixar
                            </button>
                          </div>
                        </div>
                      </div>
                      
                      {/* Preview para PDF */}
                      {selectedContract.file_path.toLowerCase().endsWith('.pdf') && (
                        <div className="mt-3 border border-gray-200 rounded-lg overflow-hidden">
                          <iframe
                            src={`http://localhost:8000/${selectedContract.file_path}#view=FitH`}
                            className="w-full h-80"
                            title="Visualização do PDF"
                          />
                        </div>
                      )}
                      
                      {/* Preview para imagens */}
                      {(selectedContract.file_path.toLowerCase().endsWith('.jpg') || 
                        selectedContract.file_path.toLowerCase().endsWith('.jpeg') || 
                        selectedContract.file_path.toLowerCase().endsWith('.png')) && (
                        <div className="mt-3 border border-gray-200 rounded-lg overflow-hidden">
                          <img
                            src={`http://localhost:8000/${selectedContract.file_path}`}
                            alt="Visualização do arquivo"
                            className="w-full h-auto max-h-96 object-contain"
                          />
                        </div>
                      )}
                      
                      {/* Mensagem para outros formatos */}
                      {(!selectedContract.file_path.toLowerCase().endsWith('.pdf') && 
                        !selectedContract.file_path.toLowerCase().endsWith('.jpg') && 
                        !selectedContract.file_path.toLowerCase().endsWith('.jpeg') && 
                        !selectedContract.file_path.toLowerCase().endsWith('.png')) && (
                        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <p className="text-sm text-yellow-800">
                            ⚠️ Este tipo de arquivo não pode ser visualizado diretamente. Use o botão "Baixar" para salvar o arquivo.
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                      <p className="text-sm text-gray-500 text-center">
                        📄 Nenhum arquivo anexado a este contrato
                      </p>
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Criado em</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {new Date(selectedContract.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
              
              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowDetails(false)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Multi-selection Actions - Fixed Bottom within page */}
      {selectedContracts.length > 0 && (
        <div className="fixed bottom-4 left-68 right-6 bg-white border border-gray-200 rounded-xl shadow-xl" style={{zIndex: 50, width: 'calc(100% - 302px)'}}>
          <div className="px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center flex-shrink-0">
                <span className="text-sm font-medium text-blue-900">
                  {selectedContracts.length} contrato(s) selecionado(s)
                </span>
              </div>
              <div className="flex flex-wrap gap-2 flex-shrink-0">
                <button
                  onClick={handleMultiView}
                  disabled={!canView}
                  className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    canView
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <Eye className="w-4 h-4 inline mr-1" />
                  <span className="hidden sm:inline">Visualizar ({selectedContracts.length})</span>
                  <span className="sm:hidden">Ver ({selectedContracts.length})</span>
                </button>
                {selectedContracts.length === 1 && contracts.find(c => c.id === selectedContracts[0])?.status === 'pendente' && (
                  <>
                    <button
                      onClick={() => handleApprove(contracts.find(c => c.id === selectedContracts[0]))}
                      className="px-3 py-2 text-sm font-medium bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                    >
                      <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="hidden sm:inline">Aprovar</span>
                      <span className="sm:hidden">Aprovar</span>
                    </button>
                    <button
                      onClick={() => handleFinish(contracts.find(c => c.id === selectedContracts[0]))}
                      className="px-3 py-2 text-sm font-medium bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                    >
                      <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="hidden sm:inline">Finalizar</span>
                      <span className="sm:hidden">Finalizar</span>
                    </button>
                  </>
                )}
                {selectedContracts.length === 1 && contracts.find(c => c.id === selectedContracts[0])?.status === 'ativo' && (
                  <button
                    onClick={() => handleFinish(contracts.find(c => c.id === selectedContracts[0]))}
                    className="px-3 py-2 text-sm font-medium bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                  >
                    <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                      <span className="hidden sm:inline">Encerrar</span>
                      <span className="sm:hidden">Encerrar</span>
                  </button>
                )}
                <button
                  onClick={() => {
                    const contract = contracts.find(c => c.id === selectedContracts[0])
                    if (contract) handleEdit(contract)
                  }}
                  disabled={!canEdit}
                  className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    canEdit
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <Edit className="w-4 h-4 inline mr-1" />
                  <span className="hidden sm:inline">Editar</span>
                  <span className="sm:hidden">Editar</span>
                </button>
                <button
                  onClick={handleMultiDelete}
                  disabled={!canDelete}
                  className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    canDelete
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <Trash2 className="w-4 h-4 inline mr-1" />
                  <span className="hidden sm:inline">Excluir ({selectedContracts.length})</span>
                  <span className="sm:hidden">Exc ({selectedContracts.length})</span>
                </button>
                <button
                  onClick={() => setSelectedContracts([])}
                  className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  <span className="hidden sm:inline">Limpar Seleção</span>
                  <span className="sm:hidden">Limpar</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add padding bottom to account for fixed action bar */}
      {selectedContracts.length > 0 && (
        <div className="h-20 sm:h-16"></div>
      )}
      </div>
    </div>
  </div>
  )
}
