import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './lib/supabase'
import TabBar from './components/TabBar'
import { ToastContainer, useToast } from './components/Toast'
import PageTransition from './components/PageTransition'
import ScrollToTop from './components/ScrollToTop'
import SplashPage from './pages/SplashPage'

import LoginPage        from './pages/LoginPage'
import AuthCallbackPage from './pages/AuthCallbackPage'
import OnboardingPage   from './pages/OnboardingPage'
import HomePage         from './pages/HomePage'
import DiagnosisPage    from './pages/DiagnosisPage'
import ResultPage       from './pages/ResultPage'
import RoutinePage      from './pages/RoutinePage'
import HistoryPage      from './pages/HistoryPage'
import MyPage           from './pages/Mypage'

export default function App() {
  const [session, setSession]       = useState<Session | null>(null)
  const [loading, setLoading]       = useState(true)
  const [showSplash, setShowSplash] = useState(true)
  const { toasts }                  = useToast()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  if (showSplash) return <SplashPage onDone={() => setShowSplash(false)} />
  if (loading) return null

  return (
    <div className="w-full min-h-dvh">
      <ScrollToTop />
      <ToastContainer toasts={toasts} />
      <PageTransition>
        <Routes>
          <Route path="/login"         element={!session ? <LoginPage />        : <Navigate to="/" replace />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="/onboarding"    element={session  ? <OnboardingPage />   : <Navigate to="/login" replace />} />
          <Route path="/"              element={session  ? <HomePage />         : <Navigate to="/login" replace />} />
          <Route path="/diagnosis"     element={session  ? <DiagnosisPage />    : <Navigate to="/login" replace />} />
          <Route path="/result"        element={session  ? <ResultPage />       : <Navigate to="/login" replace />} />
          <Route path="/routine"       element={session  ? <RoutinePage />      : <Navigate to="/login" replace />} />
          <Route path="/history"       element={session  ? <HistoryPage />      : <Navigate to="/login" replace />} />
          <Route path="/my"            element={session  ? <MyPage />           : <Navigate to="/login" replace />} />
          <Route path="*"              element={<Navigate to="/" replace />} />
        </Routes>
      </PageTransition>
      <TabBar />
    </div>
  )
}