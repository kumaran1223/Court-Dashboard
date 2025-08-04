import React from 'react'
import { Link } from 'react-router-dom'
import { Home, Search, ArrowLeft } from 'lucide-react'

const NotFoundPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full text-center">
        {/* 404 Illustration */}
        <div className="mb-8">
          <div className="text-9xl font-bold text-primary-600 mb-4">404</div>
          <div className="w-24 h-1 bg-primary-600 mx-auto rounded-full"></div>
        </div>

        {/* Error Message */}
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Page Not Found
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Sorry, we couldn't find the page you're looking for. 
          The page might have been moved, deleted, or you entered the wrong URL.
        </p>

        {/* Action Buttons */}
        <div className="space-y-4">
          <Link
            to="/"
            className="w-full btn-primary flex items-center justify-center space-x-2"
          >
            <Home className="h-5 w-5" />
            <span>Go Home</span>
          </Link>
          
          <Link
            to="/search"
            className="w-full btn-outline flex items-center justify-center space-x-2"
          >
            <Search className="h-5 w-5" />
            <span>Search Cases</span>
          </Link>
          
          <button
            onClick={() => window.history.back()}
            className="w-full btn-secondary flex items-center justify-center space-x-2"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Go Back</span>
          </button>
        </div>

        {/* Help Text */}
        <div className="mt-8 text-sm text-gray-500 dark:text-gray-400">
          <p>
            If you believe this is an error, please{' '}
            <a 
              href="mailto:support@courtdatafetcher.com" 
              className="text-primary-600 hover:text-primary-500"
            >
              contact support
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default NotFoundPage
