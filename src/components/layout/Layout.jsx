import { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { APP } from '../../config/app'
import { useAuth } from '../../features/auth/AuthContext'
import { Button, cx } from '../ui'

// Header: terang, satu garis bawah. Di layar sempit menu berubah jadi tombol "Menu".
function Navbar() {
  const { session, isAdmin, signOut } = useAuth()
  const nav = useNavigate()
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)
  const link = ({ isActive }) => cx('flex min-h-11 items-center rounded-lg px-3 text-sm font-medium transition-colors duration-150', isActive ? 'bg-accent-soft text-accent-strong' : 'text-ink hover:bg-accent-soft')
  const links = (
    <>
      <NavLink to="/" end className={link} onClick={close}>Home</NavLink>
      {!session && <NavLink to="/register" className={link} onClick={close}>Register</NavLink>}
      {session && <NavLink to={isAdmin ? '/admin' : '/dashboard'} className={link} onClick={close}>{isAdmin ? 'Admin dashboard' : 'My dashboard'}</NavLink>}
      {session
        ? <Button variant="outline" className="md:ml-2" onClick={async () => { close(); await signOut(); nav('/') }}>Sign out</Button>
        : <Button className="md:ml-2" onClick={() => { close(); nav('/login') }}>Sign in</Button>}
    </>
  )
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface">
      <div className="mx-auto flex h-16 w-full max-w-(--vp-wide) items-center justify-between px-4 sm:px-6">
        <Link to="/" className="leading-none" onClick={close}>
          <span className="block text-base font-semibold tracking-wide text-accent-strong">{APP.brand}</span>
          <span className="block text-xs font-medium tracking-[0.3em] text-muted">{APP.brandSub}</span>
        </Link>
        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">{links}</nav>
        <button type="button" className="flex min-h-11 min-w-11 items-center justify-center rounded-lg px-3 text-sm font-medium hover:bg-accent-soft md:hidden" aria-expanded={open} aria-controls="mobile-nav" onClick={() => setOpen(!open)}>
          {open ? 'Close' : 'Menu'}
        </button>
      </div>
      {open && <nav id="mobile-nav" aria-label="Main" className="rise flex flex-col gap-2 border-t border-line px-4 pb-4 pt-2 md:hidden" onKeyDown={(e) => e.key === 'Escape' && close()}>{links}</nav>}
    </header>
  )
}

export default function Layout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-lg focus:border focus:border-line focus:bg-surface focus:px-4 focus:py-2">Skip to main content</a>
      <Navbar />
      <main id="main" className="mx-auto w-full max-w-(--vp-wide) flex-1"><Outlet /></main>
      <footer className="border-t border-line bg-surface text-sm text-muted">
        <div className="mx-auto flex w-full max-w-(--vp-wide) flex-col gap-2 px-4 py-6 sm:flex-row sm:justify-between sm:px-6">
          <p>© {new Date().getFullYear()} {APP.brand} {APP.brandSub}. All rights reserved.</p>
          <p>Registration portal</p>
        </div>
      </footer>
    </div>
  )
}
