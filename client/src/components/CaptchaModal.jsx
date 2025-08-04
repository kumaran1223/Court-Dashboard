import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Shield, RefreshCw, CheckCircle } from 'lucide-react'
import Modal from './Modal'
import LoadingSpinner from './LoadingSpinner'

const CaptchaModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  captchaImage, 
  isLoading = false 
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false)
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm()

  const handleCaptchaSubmit = (data) => {
    onSubmit(data.captcha)
    reset()
  }

  const handleRefreshCaptcha = async () => {
    setIsRefreshing(true)
    // Simulate refresh - in real app, this would call API to get new CAPTCHA
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsRefreshing(false)
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="CAPTCHA Verification Required"
      size="md"
    >
      <div className="space-y-6">
        {/* Info */}
        <div className="bg-gold-50 dark:bg-gold-900/20 border border-gold-200 dark:border-gold-800/30 rounded-lg p-4">
          <div className="flex items-center">
            <Shield className="h-5 w-5 text-gold-600 mr-2" />
            <p className="text-sm text-gold-700 dark:text-gold-300">
              The Delhi High Court website requires CAPTCHA verification to prevent automated access. 
              Please enter the text shown in the image below.
            </p>
          </div>
        </div>

        {/* CAPTCHA Image */}
        <div className="text-center">
          <div className="inline-block bg-gray-100 dark:bg-navy-700 p-4 rounded-lg border-2 border-gold-200 dark:border-gold-800/30">
            {captchaImage ? (
              <img 
                src={captchaImage} 
                alt="CAPTCHA" 
                className="max-w-full h-auto rounded border"
              />
            ) : (
              <div className="w-48 h-16 bg-gray-200 dark:bg-navy-600 rounded flex items-center justify-center">
                <span className="text-gray-500 dark:text-gray-400">Loading CAPTCHA...</span>
              </div>
            )}
          </div>
          
          <button
            onClick={handleRefreshCaptcha}
            disabled={isRefreshing}
            className="mt-3 text-sm text-gold-600 hover:text-gold-700 dark:text-gold-400 dark:hover:text-gold-300 flex items-center justify-center mx-auto space-x-1 transition-colors duration-200"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh CAPTCHA</span>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(handleCaptchaSubmit)} className="space-y-4">
          <div>
            <label htmlFor="captcha" className="block text-sm font-semibold text-navy-700 dark:text-navy-300 mb-2">
              Enter CAPTCHA Text *
            </label>
            <input
              {...register('captcha', {
                required: 'CAPTCHA text is required',
                minLength: {
                  value: 3,
                  message: 'CAPTCHA must be at least 3 characters'
                }
              })}
              type="text"
              className="input-field text-center text-lg font-mono tracking-wider"
              placeholder="Enter the text from image"
              autoComplete="off"
              autoFocus
            />
            {errors.captcha && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.captcha.message}
              </p>
            )}
          </div>

          {/* Tips */}
          <div className="bg-navy-50 dark:bg-navy-900/50 border border-navy-200 dark:border-navy-700 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-navy-700 dark:text-navy-300 mb-2">
              CAPTCHA Tips:
            </h4>
            <ul className="text-xs text-navy-600 dark:text-navy-400 space-y-1">
              <li>• Enter the text exactly as shown (case-sensitive)</li>
              <li>• Use numbers and letters as they appear</li>
              <li>• If unclear, click "Refresh CAPTCHA" for a new image</li>
              <li>• Avoid spaces unless clearly shown in the image</li>
            </ul>
          </div>

          {/* Buttons */}
          <div className="flex space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn-secondary"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 btn-primary flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <>
                  <LoadingSpinner size="sm" color="white" />
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  <span>Verify & Continue</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  )
}

export default CaptchaModal
