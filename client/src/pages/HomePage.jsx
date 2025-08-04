import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { 
  Scale, 
  Search, 
  Shield, 
  Zap, 
  Database, 
  Clock, 
  CheckCircle,
  ArrowRight,
  Users,
  FileText,
  BarChart3
} from 'lucide-react'

const HomePage = () => {
  const { isAuthenticated } = useAuth()

  const features = [
    {
      icon: Search,
      title: 'Advanced Case Search',
      description: 'Search Delhi High Court cases by type, number, and filing year with intelligent filtering.'
    },
    {
      icon: Shield,
      title: 'Secure & Private',
      description: 'Your data is protected with enterprise-grade security and Row Level Security policies.'
    },
    {
      icon: Zap,
      title: 'Fast & Reliable',
      description: 'Automated web scraping with CAPTCHA handling for quick and accurate results.'
    },
    {
      icon: Database,
      title: 'Query History',
      description: 'Track all your searches with detailed history and export capabilities.'
    },
    {
      icon: Clock,
      title: 'Real-time Updates',
      description: 'Get instant notifications when your queries are processed and completed.'
    },
    {
      icon: FileText,
      title: 'Document Access',
      description: 'Direct access to court orders, judgments, and other legal documents.'
    }
  ]

  const stats = [
    { label: 'Cases Searched', value: '10,000+', icon: FileText },
    { label: 'Active Users', value: '500+', icon: Users },
    { label: 'Success Rate', value: '95%', icon: CheckCircle },
    { label: 'Avg Response Time', value: '< 30s', icon: Clock }
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-navy-900 via-navy-800 to-navy-700 dark:from-navy-950 dark:via-navy-900 dark:to-navy-800 py-20 lg:py-32 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23f59e0b' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center">
            <div className="flex justify-center mb-8">
              <div className="relative">
                <Scale className="h-20 w-20 text-gold-400 animate-pulse-slow" />
                <div className="absolute inset-0 bg-gold-400/20 rounded-full blur-xl animate-pulse"></div>
              </div>
            </div>
            <h1 className="text-5xl lg:text-7xl font-bold text-white mb-6 leading-tight">
              <span className="bg-gradient-to-r from-white to-gold-200 bg-clip-text text-transparent">
                Court Data Fetcher
              </span>
            </h1>
            <p className="text-xl lg:text-2xl text-gold-200 mb-4 max-w-4xl mx-auto leading-relaxed">
              Professional Legal Research Portal for Delhi High Court
            </p>
            <p className="text-lg text-gray-300 mb-12 max-w-3xl mx-auto">
              Access comprehensive case information, orders, and judgments with our advanced search system.
              Streamline your legal research with professional-grade tools and secure document access.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {isAuthenticated() ? (
                <>
                  <Link
                    to="/dashboard"
                    className="btn-primary text-lg px-8 py-3 inline-flex items-center space-x-2"
                  >
                    <BarChart3 className="h-5 w-5" />
                    <span>Go to Dashboard</span>
                  </Link>
                  <Link
                    to="/search"
                    className="btn-outline text-lg px-8 py-3 inline-flex items-center space-x-2"
                  >
                    <Search className="h-5 w-5" />
                    <span>Search Cases</span>
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/register"
                    className="btn-primary text-lg px-8 py-3 inline-flex items-center space-x-2"
                  >
                    <span>Get Started Free</span>
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                  <Link
                    to="/login"
                    className="btn-outline text-lg px-8 py-3"
                  >
                    Sign In
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="flex justify-center mb-4">
                  <stat.icon className="h-8 w-8 text-primary-600" />
                </div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {stat.value}
                </div>
                <div className="text-gray-600 dark:text-gray-400">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Powerful Features for Legal Research
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              Everything you need to efficiently search and access Delhi High Court records
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="card p-6 hover:shadow-lg transition-shadow duration-300">
                <div className="flex items-center mb-4">
                  <feature.icon className="h-8 w-8 text-primary-600 mr-3" />
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {feature.title}
                  </h3>
                </div>
                <p className="text-gray-600 dark:text-gray-400">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-20 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Simple steps to access court information
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary-600">1</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Enter Case Details
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Provide case type, number, and filing year to search Delhi High Court records
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary-600">2</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Automated Search
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Our system automatically searches the court website and handles CAPTCHAs
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary-600">3</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Get Results
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                View case details, download documents, and save to your query history
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {!isAuthenticated() && (
        <section className="py-20 bg-primary-600">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
              Join hundreds of legal professionals who trust Court Data Fetcher for their research needs
            </p>
            <Link
              to="/register"
              className="bg-white text-primary-600 hover:bg-gray-100 font-semibold py-3 px-8 rounded-lg transition-colors duration-200 inline-flex items-center space-x-2"
            >
              <span>Create Free Account</span>
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </section>
      )}
    </div>
  )
}

export default HomePage
