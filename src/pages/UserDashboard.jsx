// Pola halaman: Detail / Record — satu data milik user (status + detail + dokumen).
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase, fmtDate } from '../lib/supabase'
import { Badge, Button, Card, EmptyState, ErrorState, Skeleton } from '../components/ui'
import { DocumentPreview } from '../components/ui/DocumentPreview'
import { useAuth } from '../features/auth/AuthContext'

const Row = ({ k, v }) => (
  <div className="grid gap-1 py-4 sm:grid-cols-3 sm:gap-4">
    <dt className="text-sm text-muted">{k}</dt>
    <dd className="break-words text-sm font-medium sm:col-span-2">{v || '—'}</dd>
  </div>
)

export default function UserDashboard() {
  const { user, profile } = useAuth()
  const [reg, setReg] = useState(undefined)
  const [error, setError] = useState(false)

  const load = useCallback(async () => {
    setError(false); setReg(undefined)
    const { data, error } = await supabase.from('registrations').select('*').eq('user_id', user.id).order('submitted_at', { ascending: false }).limit(1).maybeSingle()
    if (error) setError(true); else setReg(data)
  }, [user.id])
  useEffect(() => { load() }, [load])

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-8 sm:px-6 sm:py-12">
      <div className="rise">
        <h1 className="text-[1.728rem]">Welcome{profile?.full_name ? `, ${profile.full_name}` : ''}</h1>
        <p className="mt-1 break-all text-sm text-muted">{user.email}</p>
      </div>
      {error ? <ErrorState onRetry={load} /> : reg === undefined ? (
        <div className="space-y-4"><Skeleton className="h-16" /><Skeleton className="h-56" /></div>
      ) : reg === null ? (
        <EmptyState title="No registration yet" text="Submit your details and document so we can review your registration." action={<Link to="/register"><Button>Start registration</Button></Link>} />
      ) : (
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4"><Badge status={reg.status} /><p className="text-sm text-muted">Submitted {fmtDate(reg.submitted_at)}</p></div>
            {reg.status === 'rejected' && <Link to="/register"><Button variant="outline">Submit again</Button></Link>}
          </div>
          <dl className="mt-4 divide-y divide-line border-t border-line">
            <Row k="Full name" v={reg.full_name} />
            <Row k="Email" v={reg.email} />
            <Row k="Company" v={reg.company_name} />
            <Row k="Phone" v={reg.phone_number} />
            <Row k="Category" v={reg.registration_category} />
          </dl>
          <div className="mt-6 border-t border-line pt-6">
            <h2 className="mb-3 text-base font-semibold">Uploaded document</h2>
            <DocumentPreview path={reg.document_path} />
          </div>
        </Card>
      )}
    </div>
  )
}
