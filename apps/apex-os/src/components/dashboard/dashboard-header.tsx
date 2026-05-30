import { useAuth } from '../../contexts/auth-context'

interface DashboardHeaderProps {
  onMenuClick?: () => void
}

export function DashboardHeader({ onMenuClick }: DashboardHeaderProps) {
  const { user, signOut } = useAuth()

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Left: Menu toggle + Logo */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="text-xl font-bold text-indigo-900">ApexOS</h1>
        </div>

        {/* Right: User email + Sign out */}
        <div className="flex items-center space-x-4">
          <span className="hidden sm:block text-sm text-gray-600">{user?.email}</span>
          <button
            onClick={() => signOut()}
            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  )
}
