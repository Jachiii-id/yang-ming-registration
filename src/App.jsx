import { Link, Route, Routes } from 'react-router-dom'
import Layout from './components/layout/Layout'
import { Guard, RoleRedirect } from './routes/Guard'
import LandingPage from './pages/LandingPage'
import RegisterPage from './pages/RegisterPage'
import LoginPage from './pages/LoginPage'
import UserDashboard from './pages/UserDashboard'
import AdminDashboard from './pages/AdminDashboard'
import { EmptyState, Button } from './components/ui'

const NotFound = () => (
  <div className="mx-auto max-w-xl px-4 py-16">
    <EmptyState title="Page not found" text="Check the address, or return to the home page." action={<Link to="/"><Button>Go to home page</Button></Link>} />
  </div>
)

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<LandingPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="app" element={<RoleRedirect />} />
        <Route path="dashboard" element={<Guard><UserDashboard /></Guard>} />
        <Route path="admin" element={<Guard admin><AdminDashboard /></Guard>} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
