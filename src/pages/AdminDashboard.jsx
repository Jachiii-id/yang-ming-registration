// Pola halaman: List / Index — cari, filter, urut, paginasi; detail dibuka di slide-over.
import { useCallback, useEffect, useRef, useState } from 'react'
import { APP, STATUS } from '../config/app'
import { supabase, openDocument, fmtDate } from '../lib/supabase'
import { Badge, Button, Card, EmptyState, ErrorState, Field, Input, Modal, Select, Skeleton, cx, useToast } from '../components/ui'

const cols = [['full_name', 'Name'], ['email', 'Email'], ['company_name', 'Company'], ['submitted_at', 'Submitted'], ['status', 'Status']]

function Detail({ reg, onClose, onChanged }) {
  const toast = useToast()
  const [note, setNote] = useState('')
  const [confirm, setConfirm] = useState(null)
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    supabase.from('registration_notes').select('notes').eq('registration_id', reg.id).maybeSingle().then(({ data }) => setNote(data?.notes || ''))
  }, [reg.id])

  const changeStatus = async (s) => {
    setBusy(true)
    const { error } = await supabase.from('registrations').update({ status: s }).eq('id', reg.id)
    setBusy(false)
    if (error) return toast('Could not update the status.', 'error')
    toast(`Registration ${s}.`, 'success'); onChanged()
  }
  const saveNote = async () => {
    const { error } = await supabase.from('registration_notes').upsert({ registration_id: reg.id, notes: note, updated_at: new Date().toISOString() })
    toast(error ? 'Could not save the note.' : 'Note saved.', error ? 'error' : 'success')
  }
  const rows = [['Email', reg.email], ['Company', reg.company_name], ['Phone', reg.phone_number], ['Category', reg.registration_category], ['Submitted', fmtDate(reg.submitted_at)]]
  return (
    <Modal open onClose={onClose} title={reg.full_name}>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-4"><Badge status={reg.status} /><Button variant="outline" onClick={() => openDocument(reg.document_path, toast)}>Open document</Button></div>
        <dl className="divide-y divide-line text-sm">
          {rows.map(([k, v]) => <div key={k} className="grid gap-1 py-3 sm:grid-cols-3"><dt className="text-muted">{k}</dt><dd className="break-words font-medium sm:col-span-2">{v || '—'}</dd></div>)}
        </dl>
        <Field id="note" label="Internal notes" hint="Only administrators can see these.">
          <textarea id="note" rows={3} value={note} onChange={(e) => setNote(e.target.value)} className="w-full rounded-lg border border-line-strong bg-surface p-3 text-base sm:text-sm" />
        </Field>
        <Button variant="outline" onClick={saveNote}>Save note</Button>
        <div className="border-t border-line pt-6">
          {confirm ? (
            <div role="alertdialog" aria-label="Confirm status change" className="space-y-3">
              <p className="text-sm">Mark the registration of <strong className="font-medium">{reg.full_name}</strong> as <strong className="font-medium">{STATUS[confirm]}</strong>?</p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button variant={confirm === 'rejected' ? 'danger' : 'primary'} loading={busy} onClick={() => changeStatus(confirm)}>Confirm {confirm === 'approved' ? 'approval' : confirm === 'rejected' ? 'rejection' : 'change'}</Button>
                <Button variant="outline" onClick={() => setConfirm(null)}>Cancel</Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2 sm:flex-row">
              {reg.status !== 'approved' && <Button onClick={() => setConfirm('approved')}>Approve registration</Button>}
              {reg.status !== 'rejected' && <Button variant="danger" onClick={() => setConfirm('rejected')}>Reject registration</Button>}
              {reg.status !== 'pending' && <Button variant="outline" onClick={() => setConfirm('pending')}>Set to pending</Button>}
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}

export default function AdminDashboard() {
  const [q, setQ] = useState('')
  const [dq, setDq] = useState('')
  const [status, setStatus] = useState('all')
  const [sort, setSort] = useState({ col: 'submitted_at', dir: 'desc' })
  const [page, setPage] = useState(0)
  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [counts, setCounts] = useState(null)
  const [state, setState] = useState('loading')
  const [sel, setSel] = useState(null)
  const searchRef = useRef(null)

  // Tekan "/" untuk fokus ke pencarian.
  useEffect(() => {
    const k = (e) => { if (e.key === '/' && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) { e.preventDefault(); searchRef.current?.focus() } }
    document.addEventListener('keydown', k)
    return () => document.removeEventListener('keydown', k)
  }, [])

  useEffect(() => {
    const t = setTimeout(() => { setDq(q.replace(/[%,()*]/g, '').trim()); setPage(0) }, 300)
    return () => clearTimeout(t)
  }, [q])

  const load = useCallback(async () => {
    setState('loading')
    let qb = supabase.from('registrations').select('*', { count: 'exact' })
    if (status !== 'all') qb = qb.eq('status', status)
    if (dq) qb = qb.or(`full_name.ilike.%${dq}%,email.ilike.%${dq}%`)
    const from = page * APP.pageSize
    const { data, count, error } = await qb.order(sort.col, { ascending: sort.dir === 'asc' }).range(from, from + APP.pageSize - 1)
    if (error) return setState('error')
    setRows(data); setTotal(count ?? 0); setState('ready')
    const c = async (s) => { let b = supabase.from('registrations').select('id', { count: 'exact', head: true }); if (s) b = b.eq('status', s); return (await b).count ?? 0 }
    const [all, pending, approved, rejected] = await Promise.all([c(), c('pending'), c('approved'), c('rejected')])
    setCounts({ all, pending, approved, rejected })
  }, [dq, status, sort, page])
  useEffect(() => { load() }, [load])

  const toggleSort = (col) => { setSort((s) => ({ col, dir: s.col === col && s.dir === 'asc' ? 'desc' : 'asc' })); setPage(0) }
  const pages = Math.max(1, Math.ceil(total / APP.pageSize))
  const filtered = dq || status !== 'all'
  const n = (k) => (counts ? ` (${counts[k]})` : '')
  const clear = () => { setQ(''); setStatus('all') }

  return (
    <div className="space-y-6 px-4 py-8 sm:px-6 sm:py-12">
      <div>
        <h1 className="text-[1.728rem]">Registrations</h1>
        <p className="mt-1 text-sm text-muted">Review submissions, open documents, and approve or reject each one.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-[1fr_14rem]">
        <Field id="search" label="Search"><Input id="search" ref={searchRef} type="search" placeholder="Name or email (press /)" value={q} onChange={(e) => setQ(e.target.value)} /></Field>
        <Field id="status" label="Status">
          <Select id="status" value={status} onChange={(e) => { setStatus(e.target.value); setPage(0) }}>
            <option value="all">All{n('all')}</option>
            {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v}{n(k)}</option>)}
          </Select>
        </Field>
      </div>
      {filtered && (
        <p className="flex flex-wrap items-center gap-2 text-sm text-muted">
          Active filters:{status !== 'all' && <span className="font-medium text-ink">{STATUS[status]}</span>}{dq && <span className="font-medium text-ink">“{dq}”</span>}
          <Button variant="ghost" className="min-h-11" onClick={clear}>Clear all filters</Button>
        </p>
      )}

      {state === 'error' ? <ErrorState onRetry={load} /> : state === 'loading' && !rows.length ? (
        <div className="space-y-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-14" />)}</div>
      ) : rows.length === 0 ? (
        <EmptyState title={filtered ? 'No registrations match your filters' : 'No registrations yet'} text={filtered ? 'Try broader terms or reset the filters.' : 'Registrations appear here as soon as users submit them.'}
          action={filtered && <Button onClick={clear}>Clear all filters</Button>} />
      ) : (
        <div className={cx('transition-opacity duration-200', state === 'loading' && 'opacity-60')}>
          {/* Medium+ : tabel dalam frame L1 dengan hairline */}
          <div className="hidden overflow-x-auto rounded-xl border border-line bg-surface shadow-(--shadow-soft) md:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-line bg-canvas text-sm font-medium text-muted">
                <tr>
                  {cols.map(([k, l]) => (
                    <th key={k} scope="col" aria-sort={sort.col === k ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'} className="px-4 py-2">
                      <button type="button" onClick={() => toggleSort(k)} className="flex min-h-11 items-center gap-1 hover:text-ink">{l}<span aria-hidden="true">{sort.col === k ? (sort.dir === 'asc' ? '▲' : '▼') : ''}</span></button>
                    </th>
                  ))}
                  <th scope="col" className="px-4 py-2"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((r) => (
                  <tr key={r.id} className="hover:bg-accent-soft/60">
                    <td className="px-4 py-3 font-medium">{r.full_name}</td>
                    <td className="px-4 py-3">{r.email}</td>
                    <td className="px-4 py-3">{r.company_name || '—'}</td>
                    <td className="whitespace-nowrap px-4 py-3">{fmtDate(r.submitted_at)}</td>
                    <td className="px-4 py-3"><Badge status={r.status} /></td>
                    <td className="px-4 py-2 text-right"><Button variant="outline" onClick={() => setSel(r)}>View details</Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Narrow: daftar kartu */}
          <ul className="space-y-4 md:hidden">
            {rows.map((r) => (
              <li key={r.id} className="rounded-xl border border-line bg-surface p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0"><p className="truncate font-medium">{r.full_name}</p><p className="truncate text-sm text-muted">{r.email}</p></div>
                  <Badge status={r.status} />
                </div>
                <p className="mt-2 text-sm text-muted">{r.company_name || 'No company'} · {fmtDate(r.submitted_at)}</p>
                <Button variant="outline" className="mt-4 w-full" onClick={() => setSel(r)}>View details</Button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <nav aria-label="Pagination" className="flex items-center justify-between gap-4">
        <Button variant="outline" disabled={page === 0} onClick={() => setPage(page - 1)}>Previous page</Button>
        <p className="text-sm text-muted">Page {page + 1} of {pages}</p>
        <Button variant="outline" disabled={page + 1 >= pages} onClick={() => setPage(page + 1)}>Next page</Button>
      </nav>
      {sel && <Detail reg={sel} onClose={() => setSel(null)} onChanged={() => { setSel(null); load() }} />}
    </div>
  )
}
