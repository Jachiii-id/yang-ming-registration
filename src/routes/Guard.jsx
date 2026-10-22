import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthContext'
import { Skeleton } from '../components/ui'

export function Guard({ admin, children }) {
  const { session, loading, isAdmin } = useAuth()
  const loc = useLocation()
  if (loading) return <div className="mx-auto max-w-6xl space-y-4 p-6"><Skeleton className="h-10 w-64" /><Skeleton className="h-48" /></div>
  if (!session) return <Navigate to="/login" state={{ from: loc.pathname }} replace />
  if (admin && !isAdmin) return <Navigate to="/dashboard" replace />
  return children
}

export function RoleRedirect() {
  const { session, loading, isAdmin } = useAuth()
  if (loading) return null
  return <Navigate to={!session ? '/login' : isAdmin ? '/admin' : '/dashboard'} replace />
}
