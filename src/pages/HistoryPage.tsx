import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout'
import { toast } from '../components/Toast'
import { SKIN_COLOR } from '../lib/skinColors'
import type { SkinDiagnosis } from '../types'

const DAYS = ['일', '월', '화', '수', '목', '금', '토']

export default function HistoryPage() {
  const navigate = useNavigate()
  const [diagnoses, setDiagnoses] = useState<SkinDiagnosis[]>([])
  const [selected, setSelected] = useState<SkinDiagnosis | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())

  const fetchHistory = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data, error } = await supabase
        .from('skin_diagnoses').select('*').eq('user_id', user.id)
        .order('created_at', { ascending: false })
      if (error) throw error
      setDiagnoses(data || [])
    } catch {
      toast('기록을 불러오는데 실패했어요', 'error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchHistory() }, [fetchHistory])
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setSelected(null); setDeleteConfirm(null) }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleDelete = async (id: string) => {
    setDeleting(true)
    try {
      const { error } = await supabase.from('skin_diagnoses').delete().eq('id', id)
      if (error) throw error
      setDiagnoses(prev => prev.filter(d => d.id !== id))
      setSelected(null)
      setDeleteConfirm(null)
      toast('진단 내역이 삭제됐어요', 'info')
    } catch {
      toast('삭제에 실패했어요', 'error')
    } finally { setDeleting(false) }
  }

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const diagnosisMap = useMemo(() => diagnoses.reduce((acc, d) => {
    const date = new Date(d.created_at)
    const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    if (!acc[dateKey]) acc[dateKey] = []
    acc[dateKey].push(d)
    return acc
  }, {} as Record<string, SkinDiagnosis[]>), [diagnoses])

  const calendarDays = useMemo((): (number | null)[] => {
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    return [
      ...Array(firstDay).fill(null),
      ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ]
  }, [year, month])

  const monthDiagnoses = useMemo(() => diagnoses.filter(d => {
    const date = new Date(d.created_at)
    return date.getFullYear() === year && date.getMonth() === month
  }), [diagnoses, year, month])

  const toDateKey = (day: number) =>
    `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`

  const today = new Date()
  const isToday = (day: number) =>
    day === today.getDate() && month === today.getMonth() && year === today.getFullYear()

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })

  const getColor = (skinType: string) => SKIN_COLOR[skinType] || SKIN_COLOR['복합성']

  if (loading) return (
    <div className="flex items-center justify-center min-h-dvh">
      <p className="text-sm text-gray-400">불러오는 중...</p>
    </div>
  )

  return (
    <div className="flex flex-col min-h-dvh pb-20">
      <header className="glass-nav w-full h-16">
        <Layout className="flex flex-col justify-center h-full">
          <h2 className="text-lg font-semibold text-gray-800">진단 히스토리</h2>
          <p className="text-sm text-gray-400 mt-0.5">진단한 날짜를 확인해보세요</p>
        </Layout>
      </header>

      {/* 삭제 확인 모달 */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-60 flex items-center justify-center px-6"
          style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
          onClick={() => setDeleteConfirm(null)}>
          <div className="glass-modal w-full max-w-sm rounded-2xl p-6"
            onClick={(e) => e.stopPropagation()}>
            <p className="text-base font-semibold text-gray-800 mb-2">진단 내역을 삭제할까요?</p>
            <p className="text-sm text-gray-400 mb-5">삭제하면 복구할 수 없어요.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="btn-secondary" style={{ flex: 1 }}>취소</button>
              <button onClick={() => handleDelete(deleteConfirm)} disabled={deleting}
                className="flex-1 h-13 rounded-2xl text-sm font-medium text-white transition-all"
                style={{ background: 'rgba(224,96,128,0.85)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)' }}>
                {deleting ? '삭제 중...' : '삭제'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 상세 모달 */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
          onClick={() => setSelected(null)}>
          <div className="glass-modal w-full md:max-w-lg rounded-t-3xl md:rounded-3xl p-6 max-h-[85dvh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}>
            <div className="w-8 h-1 rounded-full mx-auto mb-5 md:hidden" style={{ background: 'rgba(181,213,238,0.5)' }} />

            <div className="rounded-2xl p-5 mb-4"
              style={{ background: getColor(selected.skin_type).bg, backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.4)' }}>
              <p className="text-xs mb-1" style={{ color: getColor(selected.skin_type).text, opacity: 0.6 }}>
                {formatDate(selected.created_at)}
              </p>
              <p className="text-2xl font-semibold" style={{ color: getColor(selected.skin_type).text }}>
                {selected.skin_type} 피부
              </p>
              <p className="text-sm mt-1 leading-relaxed" style={{ color: getColor(selected.skin_type).text, opacity: 0.75 }}>
                {selected.reason}
              </p>
            </div>

            <div className="mb-4">
              <p className="text-xs font-semibold text-gray-400 mb-1.5">입력한 고민</p>
              <p className="text-sm text-gray-600 rounded-xl p-3 leading-relaxed"
                style={{ background: 'rgba(234,243,250,0.4)', backdropFilter: 'blur(8px)' }}>{selected.concerns}</p>
            </div>

            {selected.ai_result?.recommendedIngredients?.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-semibold text-gray-400 mb-2">추천 성분</p>
                <div className="flex flex-wrap gap-2">
                  {selected.ai_result.recommendedIngredients.map((ing) => (
                    <span key={ing.name} className="text-xs px-3 py-1 rounded-full"
                      style={{ background: 'rgba(255,255,255,0.5)', backdropFilter: 'blur(8px)', color: getColor(selected.skin_type).text }}>
                      {ing.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {selected.ai_result?.warnings?.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-semibold text-gray-400 mb-2">주의 성분</p>
                <div className="flex flex-wrap gap-2">
                  {selected.ai_result.warnings.map((w) => (
                    <span key={w} className="text-xs px-3 py-1 rounded-full"
                      style={{ background: 'rgba(255,240,243,0.7)', backdropFilter: 'blur(8px)', color: '#D06080' }}>{w}</span>
                  ))}
                </div>
              </div>
            )}

            {(selected.ai_result?.morningRoutine?.length > 0 || selected.ai_result?.nightRoutine?.length > 0) && (
              <div className="mb-5">
                <p className="text-xs font-semibold text-gray-400 mb-2">추천 루틴</p>
                <div className="flex flex-col gap-2">
                  {[...(selected.ai_result.morningRoutine || []), ...(selected.ai_result.nightRoutine || [])].map((step, i) => (
                    <div key={i} className="flex items-start gap-3 rounded-xl p-3"
                      style={{ background: 'rgba(234,243,250,0.4)', backdropFilter: 'blur(8px)' }}>
                      <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 mt-0.5"
                        style={{ background: 'rgba(255,255,255,0.5)', color: getColor(selected.skin_type).text }}>
                        {step.step}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">{step.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{step.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(selected.id)}
                className="flex-1 h-13 rounded-2xl text-sm font-medium transition-all"
                style={{ background: 'rgba(255,240,243,0.7)', backdropFilter: 'blur(10px)', color: '#D06080' }}>
                삭제
              </button>
              <button onClick={() => setSelected(null)} className="btn-secondary" style={{ flex: 1 }}>닫기</button>
            </div>
          </div>
        </div>
      )}

      <Layout className="pt-6">
        {diagnoses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-16 h-16 rounded-full flex items-center justify-center glass-card">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#89BCE2" strokeWidth="1.8" strokeLinecap="round">
                <path d="M12 8V12L15 15"/><circle cx="12" cy="12" r="9"/>
              </svg>
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-gray-600">진단 기록이 없어요</p>
              <p className="text-xs text-gray-400 mt-1">첫 번째 피부 진단을 받아보세요</p>
            </div>
            <button onClick={() => navigate('/diagnosis')} className="btn-primary" style={{ width: 'auto', padding: '0 28px' }}>
              지금 진단하기
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* 캘린더 */}
            <div className="lg:col-span-2 glass-card rounded-2xl p-5">
              <div className="flex items-center justify-between mb-5">
                <button onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
                  className="w-8 h-8 flex items-center justify-center rounded-full transition-colors"
                  style={{ background: 'rgba(234,243,250,0.5)', backdropFilter: 'blur(8px)' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8BADC8" strokeWidth="2" strokeLinecap="round">
                    <path d="M15 18l-6-6 6-6"/>
                  </svg>
                </button>
                <p className="text-sm font-semibold text-gray-700">{year}년 {month + 1}월</p>
                <button onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
                  className="w-8 h-8 flex items-center justify-center rounded-full transition-colors"
                  style={{ background: 'rgba(234,243,250,0.5)', backdropFilter: 'blur(8px)' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8BADC8" strokeWidth="2" strokeLinecap="round">
                    <path d="M9 18l6-6-6-6"/>
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-7 mb-2">
                {DAYS.map((d, i) => (
                  <div key={d} className="text-center text-xs font-medium py-1"
                    style={{ color: i === 0 ? '#F0A8C0' : i === 6 ? '#89BCE2' : '#8BADC8' }}>
                    {d}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-y-1">
                {calendarDays.map((day, idx) => {
                  if (!day) return <div key={`empty-${idx}`} />
                  const dateKey = toDateKey(day)
                  const dayDiagnoses = diagnosisMap[dateKey] || []
                  const hasDiagnosis = dayDiagnoses.length > 0
                  const _isToday = isToday(day)
                  const isSun = (idx % 7) === 0
                  const isSat = (idx % 7) === 6
                  const c = hasDiagnosis ? getColor(dayDiagnoses[0].skin_type) : null

                  return (
                    <button key={day}
                      onClick={() => hasDiagnosis && setSelected(dayDiagnoses[0])}
                      className="flex flex-col items-center py-1.5 rounded-xl transition-all"
                      style={{ cursor: hasDiagnosis ? 'pointer' : 'default', background: hasDiagnosis ? c!.bg : 'transparent' }}>
                      <span className="text-xs font-medium w-7 h-7 flex items-center justify-center rounded-full"
                        style={{
                          color: _isToday ? 'white' : isSun ? '#F0A8C0' : isSat ? '#89BCE2' : '#5A5A7A',
                          background: _isToday ? 'rgba(137,188,226,0.85)' : 'transparent',
                          backdropFilter: _isToday ? 'blur(10px)' : undefined,
                          fontWeight: _isToday ? 600 : 400,
                        }}>
                        {day}
                      </span>
                      <div className="flex gap-0.5 mt-0.5 h-2 items-center">
                        {dayDiagnoses.slice(0, 3).map((d, i) => (
                          <div key={i} className="w-1.5 h-1.5 rounded-full"
                            style={{ background: getColor(d.skin_type).dot }} />
                        ))}
                      </div>
                    </button>
                  )
                })}
              </div>

              <div className="flex flex-wrap gap-3 mt-5 pt-4 border-t border-white/20">
                {Object.entries(SKIN_COLOR).map(([type, c]) => (
                  <div key={type} className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ background: c.dot }} />
                    <span className="text-xs text-gray-400">{type}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 이번 달 목록 */}
            <div className="flex flex-col gap-4">
              <p className="text-sm font-semibold text-gray-700">{month + 1}월 진단 기록</p>

              {monthDiagnoses.length === 0 ? (
                <div className="glass-card rounded-2xl p-6 flex flex-col items-center gap-2 text-center">
                  <p className="text-sm text-gray-400">이번 달 기록이 없어요</p>
                  <button onClick={() => navigate('/diagnosis')} className="text-xs font-medium" style={{ color: '#89BCE2' }}>
                    지금 진단하기 →
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {monthDiagnoses.map((d) => (
                      <div key={d.id} className="glass-card w-full rounded-2xl overflow-hidden">
                        <button onClick={() => setSelected(d)} className="w-full flex items-center gap-3 p-4 text-left">
                          <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-sm font-semibold"
                            style={{ background: getColor(d.skin_type).bg, backdropFilter: 'blur(8px)', color: getColor(d.skin_type).text }}>
                            {d.skin_type[0]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-700">{d.skin_type} 피부</p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {new Date(d.created_at).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })}
                            </p>
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); setDeleteConfirm(d.id) }}
                            className="w-7 h-7 flex items-center justify-center rounded-full shrink-0 hover:bg-red-50 transition-colors">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#CCAABB" strokeWidth="2" strokeLinecap="round">
                              <path d="M3 6h18M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2"/>
                            </svg>
                          </button>
                        </button>
                      </div>
                    ))}
                </div>
              )}

              {diagnoses.length > 0 && (
                <div className="glass-card rounded-2xl p-4 flex items-center justify-between">
                  <p className="text-xs text-gray-400">총 진단 횟수</p>
                  <p className="text-sm font-semibold" style={{ color: '#89BCE2' }}>{diagnoses.length}회</p>
                </div>
              )}
            </div>
          </div>
        )}
      </Layout>
    </div>
  )
}
