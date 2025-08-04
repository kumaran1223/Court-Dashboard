import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { 
  Search, 
  History, 
  FileText, 
  TrendingUp, 
  Clock, 
  CheckCircle,
  AlertCircle,
  BarChart3,
  Users,
  Calendar
} from 'lucide-react'

const DashboardPage = () => {
  const { user } = useAuth()

  // Mock data - in real app, this would come from API
  const stats = {
    totalQueries: 24,
    successfulQueries: 22,
    failedQueries: 2,
    recentQueries: 5
  }

  const recentQueries = [
    {
      id: 1,
      caseType: 'Civil',
      caseNumber: 'CS(OS) 123/2023',
      filingYear: 2023,
      status: 'completed',
      timestamp: '2025-08-04T10:30:00Z'
    },
    {
      id: 2,
      caseType: 'Writ Petition',
      caseNumber: 'W.P.(C) 456/2024',
      filingYear: 2024,
      status: 'completed',
      timestamp: '2025-08-04T09:15:00Z'
    },
    {
      id: 3,
      caseType: 'Criminal',
      caseNumber: 'Crl.A. 789/2022',
      filingYear: 2022,
      status: 'failed',
      timestamp: '2025-08-04T08:45:00Z'
    }
  ]

  const quickActions = [
    {
      title: 'Search New Case',
      description: 'Search for case information from Delhi High Court',
      icon: Search,
      href: '/search',
      color: 'bg-primary-500'
    },
    {
      title: 'View History',
      description: 'Browse your previous search queries',
      icon: History,
      href: '/history',
      color: 'bg-green-500'
    },
    {
      title: 'Export Data',
      description: 'Download your query history as CSV',
      icon: FileText,
      href: '/history?export=true',
      color: 'bg-blue-500'
    }
  ]

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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Welcome back, {user?.user_metadata?.first_name || 'User'}!
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Here's an overview of your court data search activity
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BarChart3 className="h-8 w-8 text-primary-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Total Queries
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.totalQueries}
                </p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Successful
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.successfulQueries}
                </p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Failed
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.failedQueries}
                </p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Clock className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Recent (24h)
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.recentQueries}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <div className="lg:col-span-1">
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Quick Actions
                </h3>
              </div>
              <div className="card-body space-y-4">
                {quickActions.map((action, index) => (
                  <Link
                    key={index}
                    to={action.href}
                    className="flex items-center p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                  >
                    <div className={`flex-shrink-0 p-2 rounded-lg ${action.color}`}>
                      <action.icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {action.title}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {action.description}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Queries */}
          <div className="lg:col-span-2">
            <div className="card">
              <div className="card-header flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Recent Queries
                </h3>
                <Link
                  to="/history"
                  className="text-sm text-primary-600 hover:text-primary-500"
                >
                  View all
                </Link>
              </div>
              <div className="card-body">
                {recentQueries.length > 0 ? (
                  <div className="space-y-4">
                    {recentQueries.map((query) => (
                      <div
                        key={query.id}
                        className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {query.caseType}
                            </span>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              •
                            </span>
                            <span className="text-sm text-gray-600 dark:text-gray-300">
                              {query.caseNumber}
                            </span>
                          </div>
                          <div className="flex items-center space-x-4 mt-1">
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              Year: {query.filingYear}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {formatDate(query.timestamp)}
                            </span>
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          {getStatusBadge(query.status)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">
                      No queries yet. Start by searching for a case.
                    </p>
                    <Link
                      to="/search"
                      className="mt-4 inline-flex items-center btn-primary"
                    >
                      <Search className="h-4 w-4 mr-2" />
                      Search Cases
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Success Rate Chart Placeholder */}
        <div className="mt-8">
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Query Success Rate
              </h3>
            </div>
            <div className="card-body">
              <div className="flex items-center justify-center h-32 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="text-center">
                  <TrendingUp className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Success Rate: {Math.round((stats.successfulQueries / stats.totalQueries) * 100)}%
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    Chart visualization coming soon
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardPage
