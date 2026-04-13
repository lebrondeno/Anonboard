import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './lib/AuthContext'
import { ThemeProvider } from './lib/ThemeContext'
import Home from './pages/Home'
import Submit from './pages/Submit'
import Admin from './pages/Admin'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import CatchUp from './pages/CatchUp'
import Survey from './pages/Survey'
import Create from './pages/Create'
import BottomNav from './components/BottomNav'
import PageTransition from './components/PageTransition'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return null
  return user ? <>{children}</> : <Navigate to="/login" replace />
}

function AppRoutes() {
  const location = useLocation()
  return (
    <>
      <PageTransition>
        <Routes location={location} key={location.pathname}>
          <Route path="/"              element={<Home />} />
          <Route path="/login"         element={<Login />} />
          <Route path="/create/:type"  element={<Create />} />
          <Route path="/s/:id"         element={<Submit />} />
          <Route path="/chat/:id"      element={<CatchUp />} />
          <Route path="/survey/:id"    element={<Survey />} />
          <Route path="/admin/:id"     element={<Admin />} />
          <Route path="/dashboard"     element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        </Routes>
      </PageTransition>
      <BottomNav />
    </>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  )
}
