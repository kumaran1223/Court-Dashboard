import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useAuth } from '../hooks/useAuth'
import { User, Mail, Lock, Save, Eye, EyeOff } from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'
import toast from 'react-hot-toast'

const ProfilePage = () => {
  const { user, updateProfile, updatePassword } = useAuth()
  const [activeTab, setActiveTab] = useState('profile')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    formState: { errors: profileErrors, isSubmitting: isSubmittingProfile }
  } = useForm({
    defaultValues: {
      firstName: user?.user_metadata?.first_name || '',
      lastName: user?.user_metadata?.last_name || '',
      email: user?.email || ''
    }
  })

  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    formState: { errors: passwordErrors, isSubmitting: isSubmittingPassword },
    watch,
    reset: resetPasswordForm
  } = useForm()

  const newPassword = watch('newPassword')

  const onSubmitProfile = async (data) => {
    const { error } = await updateProfile({
      first_name: data.firstName,
      last_name: data.lastName
    })

    if (!error) {
      toast.success('Profile updated successfully!')
    }
  }

  const onSubmitPassword = async (data) => {
    const { error } = await updatePassword(data.newPassword)

    if (!error) {
      resetPasswordForm()
      toast.success('Password updated successfully!')
    }
  }

  const tabs = [
    { id: 'profile', label: 'Profile Information', icon: User },
    { id: 'security', label: 'Security', icon: Lock }
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Profile Settings
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage your account information and security settings
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                    activeTab === tab.id
                      ? 'bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <tab.icon className="h-5 w-5 mr-3" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {activeTab === 'profile' && (
              <div className="card">
                <div className="card-header">
                  <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                    Profile Information
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Update your personal information and email address
                  </p>
                </div>
                <div className="card-body">
                  <form onSubmit={handleSubmitProfile(onSubmitProfile)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* First Name */}
                      <div>
                        <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          First Name
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <User className="h-5 w-5 text-gray-400" />
                          </div>
                          <input
                            {...registerProfile('firstName', {
                              required: 'First name is required',
                              minLength: {
                                value: 2,
                                message: 'First name must be at least 2 characters'
                              }
                            })}
                            type="text"
                            className="input-field pl-10"
                            placeholder="Enter your first name"
                          />
                        </div>
                        {profileErrors.firstName && (
                          <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                            {profileErrors.firstName.message}
                          </p>
                        )}
                      </div>

                      {/* Last Name */}
                      <div>
                        <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Last Name
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <User className="h-5 w-5 text-gray-400" />
                          </div>
                          <input
                            {...registerProfile('lastName', {
                              required: 'Last name is required',
                              minLength: {
                                value: 2,
                                message: 'Last name must be at least 2 characters'
                              }
                            })}
                            type="text"
                            className="input-field pl-10"
                            placeholder="Enter your last name"
                          />
                        </div>
                        {profileErrors.lastName && (
                          <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                            {profileErrors.lastName.message}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Email */}
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Email Address
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Mail className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          {...registerProfile('email')}
                          type="email"
                          disabled
                          className="input-field pl-10 bg-gray-50 dark:bg-gray-700 cursor-not-allowed"
                          placeholder="Email address"
                        />
                      </div>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Email address cannot be changed. Contact support if you need to update it.
                      </p>
                    </div>

                    {/* Account Status */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Account Status
                      </label>
                      <div className="flex items-center space-x-2">
                        {user?.email_confirmed_at ? (
                          <span className="badge badge-success">Verified</span>
                        ) : (
                          <span className="badge badge-warning">Unverified</span>
                        )}
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {user?.email_confirmed_at 
                            ? 'Your email address is verified'
                            : 'Please check your email to verify your account'
                          }
                        </span>
                      </div>
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={isSubmittingProfile}
                        className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSubmittingProfile ? (
                          <>
                            <LoadingSpinner size="sm" color="white" />
                            <span>Saving...</span>
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4" />
                            <span>Save Changes</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="card">
                <div className="card-header">
                  <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                    Security Settings
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Update your password and manage security preferences
                  </p>
                </div>
                <div className="card-body">
                  <form onSubmit={handleSubmitPassword(onSubmitPassword)} className="space-y-6">
                    {/* Current Password */}
                    <div>
                      <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Current Password
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Lock className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          {...registerPassword('currentPassword', {
                            required: 'Current password is required'
                          })}
                          type={showCurrentPassword ? 'text' : 'password'}
                          className="input-field pl-10 pr-10"
                          placeholder="Enter your current password"
                        />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        >
                          {showCurrentPassword ? (
                            <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                          ) : (
                            <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                          )}
                        </button>
                      </div>
                      {passwordErrors.currentPassword && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                          {passwordErrors.currentPassword.message}
                        </p>
                      )}
                    </div>

                    {/* New Password */}
                    <div>
                      <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        New Password
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Lock className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          {...registerPassword('newPassword', {
                            required: 'New password is required',
                            minLength: {
                              value: 6,
                              message: 'Password must be at least 6 characters'
                            }
                          })}
                          type={showNewPassword ? 'text' : 'password'}
                          className="input-field pl-10 pr-10"
                          placeholder="Enter your new password"
                        />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                        >
                          {showNewPassword ? (
                            <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                          ) : (
                            <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                          )}
                        </button>
                      </div>
                      {passwordErrors.newPassword && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                          {passwordErrors.newPassword.message}
                        </p>
                      )}
                    </div>

                    {/* Confirm New Password */}
                    <div>
                      <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Lock className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          {...registerPassword('confirmPassword', {
                            required: 'Please confirm your new password',
                            validate: value => value === newPassword || 'Passwords do not match'
                          })}
                          type={showConfirmPassword ? 'text' : 'password'}
                          className="input-field pl-10 pr-10"
                          placeholder="Confirm your new password"
                        />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                          ) : (
                            <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                          )}
                        </button>
                      </div>
                      {passwordErrors.confirmPassword && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                          {passwordErrors.confirmPassword.message}
                        </p>
                      )}
                    </div>

                    {/* Password Requirements */}
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                        Password Requirements:
                      </h4>
                      <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                        <li>• At least 6 characters long</li>
                        <li>• Should contain a mix of letters and numbers</li>
                        <li>• Avoid using common passwords</li>
                      </ul>
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={isSubmittingPassword}
                        className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSubmittingPassword ? (
                          <>
                            <LoadingSpinner size="sm" color="white" />
                            <span>Updating...</span>
                          </>
                        ) : (
                          <>
                            <Lock className="h-4 w-4" />
                            <span>Update Password</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfilePage
