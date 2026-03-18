// Mock data shared between Dashboard and Contracts pages
export const getMockContracts = () => {
  return [
    {
      id: 1,
      name: 'Contrato de Serviço A',
      contract_type: 'Serviço',
      description: 'Contrato de prestação de serviços',
      value: 50000,
      start_date: '2024-01-01',
      end_date: '2024-12-31',
      billing_cycle: 'monthly',
      status: 'ativo',
      alert: 'Expira em 30 dias'
    },
    {
      id: 2,
      name: 'Contrato de Software B',
      contract_type: 'Software',
      description: 'Licenciamento de software',
      value: 25000,
      start_date: '2024-06-01',
      end_date: '2025-06-01',
      billing_cycle: 'yearly',
      status: 'ativo',
      alert: null
    },
    {
      id: 3,
      name: 'Contrato de Consultoria C',
      contract_type: 'Consultoria',
      description: 'Serviços de consultoria estratégica',
      value: 75000,
      start_date: '2024-03-01',
      end_date: '2024-09-01',
      billing_cycle: 'quarterly',
      status: 'pendente',
      alert: 'Aguardando aprovação'
    }
  ]
}

// Calculate dashboard stats from contracts
export const calculateDashboardStats = (contracts) => {
  const today = new Date()
  const thirtyDaysFromNow = new Date()
  thirtyDaysFromNow.setDate(today.getDate() + 30)
  
  const activeContracts = contracts.filter(c => c.status === 'ativo')
  const expiringContracts = contracts.filter(c => {
    if (!c.end_date) return false
    const endDate = new Date(c.end_date)
    return endDate <= thirtyDaysFromNow && endDate >= today
  })
  const expiredContracts = contracts.filter(c => {
    if (!c.end_date) return false
    return new Date(c.end_date) < today
  })
  
  return {
    total_contracts: contracts.length,
    active_contracts: activeContracts.length,
    expiring_soon: expiringContracts.length,
    expired: expiredContracts.length,
    total_value: contracts.reduce((sum, c) => sum + (c.value || 0), 0),
    potential_savings: Math.round(contracts.reduce((sum, c) => sum + (c.value || 0), 0) * 0.15)
  }
}

// Get expiring contracts with alerts
export const getExpiringContracts = (contracts) => {
  const today = new Date()
  
  return contracts
    .filter(c => {
      if (!c.end_date) return false
      const endDate = new Date(c.end_date)
      const thirtyDaysFromNow = new Date()
      thirtyDaysFromNow.setDate(today.getDate() + 30)
      return endDate <= thirtyDaysFromNow && endDate >= today
    })
    .map(c => ({
      ...c,
      alert: `Expira em ${Math.ceil((new Date(c.end_date) - today) / (1000 * 60 * 60 * 24))} dias`
    }))
}
