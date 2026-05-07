import { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { Zap, LogIn, UserPlus, AlertCircle, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext.jsx'

export default function LoginPage() {
  const { user, loginUser, registerUser } = useAuth()
  const navigate = useNavigate()
  const [isRegister, setIsRegister] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  // If already logged in, redirect to dashboard
  if (user) return <Navigate to="/dashboard" replace />

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (isRegister) {
        await registerUser(username, password)
      } else {
        await loginUser(username, password)
      }
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center px-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600/20 to-indigo-600/10" />
        <div className="relative z-10 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-primary-900/40">
            <Zap size={30} className="text-white" fill="currentColor" />
          </div>
          <h1 className="text-4xl font-bold text-white tracking-tight mb-3">
            FundSight
          </h1>
          <p className="text-lg text-slate-300 max-w-sm leading-relaxed">
            AI-powered grant application manager for charities and non-profits.
          </p>
          <div className="mt-10 grid grid-cols-3 gap-6 text-center max-w-xs mx-auto">
            <div>
              <div className="text-2xl font-bold text-white">6</div>
              <div className="text-xs text-slate-400 mt-1">Key Sections</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">AI</div>
              <div className="text-xs text-slate-400 mt-1">Suggestions</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">3</div>
              <div className="text-xs text-slate-400 mt-1">Export Formats</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg">
              <Zap size={20} className="text-white" fill="currentColor" />
            </div>
            <span className="text-2xl font-bold text-white tracking-tight">FundSight</span>
          </div>

          <div className="bg-white rounded-2xl shadow-2xl p-8 border border-slate-200/50">
            <div className="text-center mb-8">
              <h2 className="text-xl font-bold text-slate-900">
                {isRegister ? 'Create your account' : 'Welcome back'}
              </h2>
              <p className="text-sm text-slate-500 mt-1.5">
                {isRegister
                  ? 'Get started with FundSight'
                  : 'Sign in to manage your applications'}
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 mb-6 bg-red-50 border border-red-100 rounded-lg text-sm text-red-700">
                <AlertCircle size={15} className="shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Username
                </label>
                <input
                  className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent placeholder-slate-400 transition-shadow"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="w-full px-4 py-3 pr-11 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent placeholder-slate-400 transition-shadow"
                    placeholder={isRegister ? 'At least 6 characters' : 'Enter your password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete={isRegister ? 'new-password' : 'current-password'}
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 bg-primary-600 text-white text-sm font-semibold rounded-xl hover:bg-primary-700 active:bg-primary-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : isRegister ? (
                  <><UserPlus size={16} /> Create Account</>
                ) : (
                  <><LogIn size={16} /> Sign In</>
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                type="button"
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                onClick={() => { setIsRegister(!isRegister); setError('') }}
              >
                {isRegister
                  ? 'Already have an account? Sign in'
                  : "Don't have an account? Register"}
              </button>
            </div>

            {!isRegister && (
              <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-100 text-center">
                <p className="text-xs text-slate-500">
                  Default credentials: <span className="font-semibold text-slate-700">admin</span> / <span className="font-semibold text-slate-700">admin123</span>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
