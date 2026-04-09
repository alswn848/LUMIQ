import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './lib/supabase'
import TabBar from './components/TabBar'
import { ToastContainer, useToast } from './components/Toast'
import PageTransition from './components/PageTransition'
import ScrollToTop from './components/ScrollToTop'
import SplashPage from './pages/SplashPage'

import LoginPage            from './pages/LoginPage'
import AuthCallbackPage     from './pages/AuthCallbackPage'
import OnboardingPage       from './pages/OnboardingPage'
import HomePage             from './pages/HomePage'
import DiagnosisPage        from './pages/DiagnosisPage'
import ResultPage           from './pages/ResultPage'
import RoutinePage          from './pages/RoutinePage'
import HistoryPage          from './pages/HistoryPage'
import MyPage               from './pages/Mypage'
import DiaryPage            from './pages/DiaryPage'
import IngredientCheckPage  from './pages/IngredientCheckPage'

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

  // 루틴 미완료 알림: 오후 9시 이후 앱 열 때
  useEffect(() => {
    if (!session) return
    const hour = new Date().getHours()
    if (hour < 21) return
    if (Notification.permission !== 'granted') return
    const today = new Date().toISOString().split('T')[0]
    const notifiedKey = `lumiq_notified_${today}`
    if (localStorage.getItem(notifiedKey)) return

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase.from('routine_checks').select('is_done').eq('checked_at', today).eq('is_done', true).limit(1)
        .then(({ data }) => {
          if (!data || data.length === 0) {
            new Notification('LUMIQ 루틴 알림 🌿', { body: '오늘 스킨케어 루틴을 아직 완료하지 않았어요!', icon: '/logo.png' })
            localStorage.setItem(notifiedKey, '1')
          }
        })
    })
  }, [session])

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
          <Route path="/my"            element={session  ? <MyPage />              : <Navigate to="/login" replace />} />
          <Route path="/diary"         element={session  ? <DiaryPage />           : <Navigate to="/login" replace />} />
          <Route path="/ingredients"   element={session  ? <IngredientCheckPage /> : <Navigate to="/login" replace />} />
          <Route path="*"              element={<Navigate to="/" replace />} />
        </Routes>
      </PageTransition>
      <TabBar />
    </div>
  )
}