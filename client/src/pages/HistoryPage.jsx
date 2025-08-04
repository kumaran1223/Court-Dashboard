import React, { useState } from 'react'
import { History, Download, Search, Filter, Trash2, RefreshCw } from 'lucide-react'

const HistoryPage = () => {
  const [queries, setQueries] = useState([
    {
      id: 1,
      caseType: 'Civil',
      caseNumber: 'CS(OS) 123/2023',
      filingYear: 2023,
      status: 'completed',
      timestamp: '2025-08-04T10:30:00Z',
      partiesNames: 'ABC Corp vs XYZ Ltd',
      documentsCount: 2
    },
    {
      id: 2,
      caseType: 'Writ Petition',
      caseNumber: 'W.P.(C) 456/2024',
      filingYear: 2024,
      status: 'completed',
      timestamp: '2025-08-04T09:15:00Z',
      partiesNames: 'John Doe vs State of Delhi',
      documentsCount: 1
    },
    {
      id: 3,
      caseType: 'Criminal',
      caseNumber: 'Crl.A. 789/2022',
      filingYear: 2022,
      status: 'failed',
      timestamp: '2025-08-04T08:45:00Z',
      partiesNames: null,
      documentsCount: 0
    }
  ])

  const [filters, setFilters] = useState({
    caseType: '',
    status: '',
    filingYear: ''
  })

  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const caseTypes = ['Civil', 'Criminal', 'Writ Petition', 'Company Petition', 'Arbitration Petition', 'Execution Petition', 'Contempt Petition', 'Miscellaneous']
  const statuses = ['completed', 'failed', 'initiated']
  const years = Array.from({ length: 26 }, (_, i) => 2025 - i)

  const filteredQueries = queries.filter(query => {
    return (
      (!filters.caseType || query.caseType === filters.caseType) &&
      (!filters.status || query.status === filters.status) &&
      (!filters.filingYear || query.filingYear.toString() === filters.filingYear)
    )
  })

  const totalPages = Math.ceil(filteredQueries.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedQueries = filteredQueries.slice(startIndex, startIndex + itemsPerPage)

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return <span className="badge badge-success">Completed</span>
      case 'failed':
        return <span className="badge badge-error">Failed</span>
      case 'initiated':
        return <span className="badge badge-warning">In Progress</span>
      default:
        return <span className="badge badge-gray">Unknown</span>
    }
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setCurrentPage(1)
  }

  const clearFilters = () => {
    setFilters({ caseType: '', status: '', filingYear: '' })
    setCurrentPage(1)
  }

  const handleExport = () => {
    // Simulate CSV export
    const csvContent = [
      ['Case Type', 'Case Number', 'Filing Year', 'Status', 'Parties Names', 'Documents', 'Date'],
      ...filteredQueries.map(query => [
        query.caseType,
        query.caseNumber,
        query.filingYear,
        query.status,
        query.partiesNames || 'N/A',
        query.documentsCount,
        formatDate(query.timestamp)
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `court-queries-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this query?')) {
      setQueries(prev => prev.filter(q => q.id !== id))
    }
  }

  const handleRetry = (query) => {
    // Simulate retry - in real app, this would trigger a new search
    console.log('Retrying query:', query)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
            <History className="h-8 w-8 mr-3" />
            Query History
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            View and manage your previous court case searches
          </p>
        </div>

        {/* Filters and Actions */}
        <div className="card mb-6">
          <div className="card-body">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              {/* Filters */}
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                <select
                  value={filters.caseType}
                  onChange={(e) => handleFilterChange('caseType', e.target.value)}
                  className="select-field"
                >
                  <option value="">All Case Types</option>
                  {caseTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>

                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="select-field"
                >
                  <option value="">All Statuses</option>
                  {statuses.map(status => (
                    <option key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </option>
                  ))}
                </select>

                <select
                  value={filters.filingYear}
                  onChange={(e) => handleFilterChange('filingYear', e.target.value)}
                  className="select-field"
                >
                  <option value="">All Years</option>
                  {years.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>

                <button
                  onClick={clearFilters}
                  className="btn-secondary flex items-center space-x-2"
                >
                  <Filter className="h-4 w-4" />
                  <span>Clear</span>
                </button>
              </div>

              {/* Actions */}
              <div className="flex space-x-2">
                <button
                  onClick={handleExport}
                  className="btn-outline flex items-center space-x-2"
                >
                  <Download className="h-4 w-4" />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Results Summary */}
        <div className="mb-6">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Showing {paginatedQueries.length} of {filteredQueries.length} queries
          </p>
        </div>

        {/* Query List */}
        {paginatedQueries.length > 0 ? (
          <div className="space-y-4">
            {paginatedQueries.map((query) => (
              <div key={query.id} className="card">
                <div className="card-body">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-2">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                          {query.caseNumber}
                        </h3>
                        {getStatusBadge(query.status)}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Case Type:</span>
                          <p className="text-gray-900 dark:text-white">{query.caseType}</p>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Filing Year:</span>
                          <p className="text-gray-900 dark:text-white">{query.filingYear}</p>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Parties:</span>
                          <p className="text-gray-900 dark:text-white">
                            {query.partiesNames || 'Not available'}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Documents:</span>
                          <p className="text-gray-900 dark:text-white">{query.documentsCount}</p>
                        </div>
                      </div>
                      
                      <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                        Searched on {formatDate(query.timestamp)}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2 ml-4">
                      {query.status === 'failed' && (
                        <button
                          onClick={() => handleRetry(query)}
                          className="p-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                          title="Retry query"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </button>
                      )}
                      
                      {query.status === 'completed' && (
                        <button
                          className="p-2 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
                          title="View details"
                        >
                          <Search className="h-4 w-4" />
                        </button>
                      )}
                      
                      <button
                        onClick={() => handleDelete(query.id)}
                        className="p-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                        title="Delete query"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card">
            <div className="card-body text-center py-12">
              <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No queries found
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                {Object.values(filters).some(f => f) 
                  ? 'No queries match your current filters.'
                  : 'You haven\'t made any searches yet.'
                }
              </p>
              {Object.values(filters).some(f => f) ? (
                <button
                  onClick={clearFilters}
                  className="btn-secondary"
                >
                  Clear Filters
                </button>
              ) : (
                <a href="/search" className="btn-primary">
                  Start Searching
                </a>
              )}
            </div>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-gray-700 dark:text-gray-300">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default HistoryPage
