import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout'
import LumiqLogo from '../components/LumiqLogo'
import { HomePageSkeleton } from '../components/Skeleton'
import type { RoutineCheck, SkinDiagnosis, Routine } from '../types'

export default function HomePage() {
  const navigate = useNavigate()
  const [userName, setUserName] = useState('')
  const [recentDiagnoses, setRecentDiagnoses] = useState<SkinDiagnosis[]>([])
  const [todayRoutine, setTodayRoutine] = useState<Routine | null>(null)
  const [checks, setChecks] = useState<Record<number, boolean>>({})
  const [streak, setStreak] = useState(0)
  const [weeklyRate, setWeeklyRate] = useState(0)
  const [showRediagnoseBanner, setShowRediagnoseBanner] = useState(false)
  const [loading, setLoading] = useState(true)

  const calcStreak = useCallback(async (routineId: string, totalSteps: number) => {
    const dates = Array.from({ length: 30 }, (_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - i - 1)
      return d.toISOString().split('T')[0]
    })
    const { data } = await supabase
      .from('routine_checks').select('checked_at, is_done')
      .eq('routine_id', routineId).in('checked_at', dates)

    const doneByDate: Record<string, number> = {}
    data?.forEach((c: { checked_at: string; is_done: boolean }) => {
      if (c.is_done) doneByDate[c.checked_at] = (doneByDate[c.checked_at] || 0) + 1
    })

    let s = 0
    for (const dateStr of dates) {
      if ((doneByDate[dateStr] || 0) >= totalSteps) s++
      else break
    }
    setStreak(s)
  }, [])

  const calcWeeklyRate = useCallback(async (routineId: string, totalSteps: number) => {
    const dates = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - i); return d.toISOString().split('T')[0]
    })
    const { data } = await supabase
      .from('routine_checks').select('checked_at, is_done')
      .eq('routine_id', routineId).in('checked_at', dates)

    const doneByDate: Record<string, number> = {}
    data?.forEach((c: { checked_at: string; is_done: boolean }) => {
      if (c.is_done) doneByDate[c.checked_at] = (doneByDate[c.checked_at] || 0) + 1
    })

    const doneDays = dates.filter(d => (doneByDate[d] || 0) >= totalSteps).length
    setWeeklyRate(Math.round((doneDays / 7) * 100))
  }, [])

  const fetchData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('user_profiles').select('nickname').eq('user_id', user.id).maybeSingle()
      setUserName(profile?.nickname || user.email?.split('@')[0] || '사용자')

      const { data: diagnoses } = await supabase
        .from('skin_diagnoses').select('*').eq('user_id', user.id)
        .order('created_at', { ascending: false }).limit(2)
      setRecentDiagnoses(diagnoses || [])

      if (diagnoses && diagnoses.length > 0) {
        const lastDiag = new Date(diagnoses[0].created_at)
        const now = new Date()
        const daysDiff = (now.getTime() - lastDiag.getTime()) / (1000 * 60 * 60 * 24)
        if (daysDiff >= 14) setShowRediagnoseBanner(true)
      }

      const { data: routines } = await supabase
        .from('routines').select('*').eq('user_id', user.id)
        .order('created_at', { ascending: false }).limit(1)

      if (routines && routines.length > 0) {
        setTodayRoutine(routines[0])
        const today = new Date().toISOString().split('T')[0]
        const { data: checkData } = await supabase
          .from('routine_checks').select('*')
          .eq('routine_id', routines[0].id).eq('checked_at', today)
        const checkMap: Record<number, boolean> = {}
        checkData?.forEach((c: RoutineCheck) => { checkMap[c.step_index] = c.is_done })
        setChecks(checkMap)
        await calcStreak(routines[0].id, routines[0].steps?.length || 4)
        await calcWeeklyRate(routines[0].id, routines[0].steps?.length || 4)
      }
    } catch {
      // 홈 데이터 로드 실패 시 빈 상태로 표시
    } finally {
      setLoading(false)
    }
  }, [calcStreak, calcWeeklyRate])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchData() }, [fetchData])

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return `${d.getMonth() + 1}.${d.getDate()}`
  }

  const checkedCount = Object.values(checks).filter(Boolean).length
  const totalCount = todayRoutine?.steps?.length || 0
  const progress = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0

  if (loading) return (
    <div className="flex flex-col min-h-dvh pb-20">
      <header className="glass-nav w-full h-16">
        <Layout className="flex items-center justify-between h-full">
          <LumiqLogo size="sm" showText={true} />
        </Layout>
      </header>
      <HomePageSkeleton />
    </div>
  )

  return (
    <div className="flex flex-col min-h-dvh pb-20">
      {/* 헤더 */}
      <header className="glass-nav w-full h-16">
        <Layout className="flex items-center justify-between h-full">
          <LumiqLogo size="sm" showText={true} />
          <button
            onClick={() => navigate('/my')}
            className="w-9 h-9 rounded-full flex items-center justify-center transition-colors"
            style={{ background: 'rgba(234,243,250,0.6)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.5)' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8BADC8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </button>
        </Layout>
      </header>

      <Layout className="flex flex-col gap-5 pt-7">
        {/* 환영 + streak */}
        <div className="flex items-start justify-between fade-in">
          <div>
            <p className="text-xl font-semibold text-gray-800">안녕하세요, {userName}님 👋</p>
            <p className="text-sm text-gray-400 mt-1">오늘도 피부 관리 해볼까요?</p>
          </div>
          {streak > 0 && (
            <div className="flex flex-col items-center px-3 py-2 rounded-2xl glass-card">
              <span className="text-xl">🔥</span>
              <span className="text-xs font-semibold text-orange-500">{streak}일 연속</span>
            </div>
          )}
        </div>

        {/* 재진단 배너 */}
        {showRediagnoseBanner && (
          <div className="fade-in glass-card flex items-center justify-between rounded-2xl px-4 py-3 cursor-pointer"
            onClick={() => navigate('/diagnosis')}>
            <div>
              <p className="text-sm font-semibold" style={{ color: '#3A7AAE' }}>재진단을 받아볼까요?</p>
              <p className="text-xs mt-0.5" style={{ color: '#89BCE2' }}>마지막 진단에서 2주가 지났어요</p>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#89BCE2" strokeWidth="2" strokeLinecap="round">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </div>
        )}

        {/* 진단 시작 버튼 */}
        <button onClick={() => navigate('/diagnosis')}
          className="fade-in w-full rounded-2xl p-5 flex items-center gap-4 text-left"
          style={{ background: 'linear-gradient(135deg, rgba(137,188,226,0.85) 0%, rgba(90,154,200,0.88) 100%)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.3)', boxShadow: '0 8px 32px rgba(90,154,200,0.28), 0 1px 0 rgba(255,255,255,0.25) inset' }}>
          <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(255,255,255,0.25)', backdropFilter: 'blur(10px)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><path d="M21 21L16.65 16.65"/><path d="M11 8V14M8 11H14"/>
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-white">AI 피부 진단 시작하기</p>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.75)' }}>피부 고민을 입력하면 AI가 분석해드려요</p>
          </div>
        </button>

        {/* 주간 리포트 */}
        {todayRoutine && (
          <div className="fade-in grid grid-cols-3 gap-3">
            {[
              { label: '이번 주 달성률', value: `${weeklyRate}%`, color: '#89BCE2' },
              { label: '오늘 진행률',    value: `${progress}%`,   color: '#B8A8E8' },
              { label: '연속 달성',      value: `${streak}일`,    color: '#89BCE2' },
            ].map(stat => (
              <div key={stat.label} className="glass-card rounded-2xl p-4 flex flex-col gap-1">
                <p className="text-xs text-gray-400">{stat.label}</p>
                <p className="text-xl font-semibold" style={{ color: stat.color }}>{stat.value}</p>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 fade-in">
          {/* 오늘의 루틴 */}
          <div className="glass-card rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-gray-700">오늘의 루틴</p>
              <button onClick={() => navigate('/routine')} className="text-xs" style={{ color: '#89BCE2' }}>전체보기</button>
            </div>
            {todayRoutine ? (
              <>
                <div className="flex flex-col gap-2.5">
                  {todayRoutine.steps.map((step, idx) => {
                    const isDone = checks[idx] || false
                    return (
                      <div key={idx} className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${isDone ? '' : 'border border-gray-200'}`}
                          style={isDone ? { background: 'rgba(211,232,245,0.8)' } : {}}>
                          {isDone && <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#5A9AC8" strokeWidth="3" strokeLinecap="round"><path d="M20 6L9 17L4 12"/></svg>}
                        </div>
                        <span className={`text-sm ${isDone ? 'text-gray-300 line-through' : 'text-gray-600'}`}>{step.name}</span>
                        {step.product_memo && <span className="text-xs text-gray-400 ml-auto">{step.product_memo}</span>}
                      </div>
                    )
                  })}
                </div>
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-gray-400 mb-1.5"><span>진행률</span><span>{progress}%</span></div>
                  <div className="progress-bar"><div className="progress-fill" style={{ width: `${progress}%` }} /></div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center py-6 gap-2">
                <p className="text-sm text-gray-400">진단 후 루틴이 생성돼요</p>
                <button onClick={() => navigate('/diagnosis')} className="text-xs" style={{ color: '#89BCE2' }}>지금 진단하기 →</button>
              </div>
            )}
          </div>

          {/* 최근 진단 */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-4">최근 진단</p>
            {recentDiagnoses.length > 0 ? (
              <div className="flex flex-col gap-3">
                {recentDiagnoses.map(d => (
                  <button key={d.id} onClick={() => navigate('/history')}
                    className="glass-card w-full flex items-center justify-between rounded-2xl p-4 text-left">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center"
                        style={{ background: 'linear-gradient(135deg, rgba(137,188,226,0.9), rgba(90,154,200,0.9))', backdropFilter: 'blur(10px)' }}>
                        <span className="text-xs font-semibold text-white">{d.skin_type[0]}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">{d.skin_type} 피부</p>
                        <p className="text-xs text-gray-400 mt-0.5">{formatDate(d.created_at)}</p>
                      </div>
                    </div>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#B5D5EE" strokeWidth="2" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
                  </button>
                ))}
              </div>
            ) : (
              <div className="glass-card rounded-2xl p-6 flex flex-col items-center gap-2">
                <p className="text-sm text-gray-400">아직 진단 기록이 없어요</p>
              </div>
            )}
          </div>
        </div>
      </Layout>
    </div>
  )
}
