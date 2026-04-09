import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout'
import { toast } from '../components/Toast'
import { RoutinePageSkeleton } from '../components/Skeleton'
import type { Routine, RoutineCheck, RoutineStep } from '../types'

export default function RoutinePage() {
  const navigate = useNavigate()
  const [routine, setRoutine] = useState<Routine | null>(null)
  const [checks, setChecks] = useState<Record<number, boolean>>({})
  const [expanded, setExpanded] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [editMode, setEditMode] = useState(false)
  const [editSteps, setEditSteps] = useState<RoutineStep[]>([])
  const [savingEdit, setSavingEdit] = useState(false)
  const [newStepName, setNewStepName] = useState('')
  const today = new Date().toISOString().split('T')[0]
  const todayLabel = new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })

  const fetchRoutine = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: routines, error } = await supabase
        .from('routines').select('*').eq('user_id', user.id)
        .order('created_at', { ascending: false }).limit(1)
      if (error) throw error

      if (!routines || routines.length === 0) return

      const latest = routines[0]
      setRoutine(latest)

      const { data: checkData } = await supabase
        .from('routine_checks').select('*')
        .eq('routine_id', latest.id).eq('checked_at', today)

      const checkMap: Record<number, boolean> = {}
      checkData?.forEach((c: RoutineCheck) => { checkMap[c.step_index] = c.is_done })
      setChecks(checkMap)
    } catch {
      toast('루틴을 불러오는데 실패했어요', 'error')
    } finally {
      setLoading(false)
    }
  }, [today])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchRoutine() }, [fetchRoutine])

  const handleCheck = async (stepIdx: number) => {
    if (!routine) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const newValue = !checks[stepIdx]
    setChecks(prev => {
      const updated = { ...prev, [stepIdx]: newValue }
      const totalCount = routine.steps?.length || 0
      const doneCount = Object.values(updated).filter(Boolean).length
      if (doneCount === totalCount) {
        setTimeout(() => toast('🎉 오늘 루틴 완료! 훌륭해요', 'success'), 300)
      }
      return updated
    })

    if (newValue) toast(`${routine.steps[stepIdx]?.name} 완료!`, 'success')

    const { error } = await supabase.from('routine_checks').upsert({
      user_id: user.id, routine_id: routine.id,
      checked_at: today, step_index: stepIdx, is_done: newValue,
    }, { onConflict: 'routine_id,checked_at,step_index' })

    if (error) {
      setChecks(prev => ({ ...prev, [stepIdx]: !newValue }))
      toast('저장에 실패했어요', 'error')
    }
  }

  const checkedCount = Object.values(checks).filter(Boolean).length
  const totalCount = routine?.steps?.length || 0
  const progress = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0
  const isAllDone = totalCount > 0 && checkedCount === totalCount

  const handleEditSave = async () => {
    if (!routine) return
    setSavingEdit(true)
    try {
      const renumbered = editSteps.map((s, i) => ({ ...s, step: i + 1 }))
      const { error } = await supabase.from('routines').update({ steps: renumbered }).eq('id', routine.id)
      if (error) throw error
      setRoutine({ ...routine, steps: renumbered })
      setEditMode(false)
      toast('루틴이 수정됐어요!', 'success')
    } catch {
      toast('저장에 실패했어요', 'error')
    } finally { setSavingEdit(false) }
  }

  const handleAddStep = () => {
    if (!newStepName.trim()) return
    const next: RoutineStep = {
      step: editSteps.length + 1,
      name: newStepName.trim(),
      product: '',
      description: '',
      tip: '',
    }
    setEditSteps(prev => [...prev, next])
    setNewStepName('')
  }

  const handleDeleteStep = (idx: number) => {
    setEditSteps(prev => prev.filter((_, i) => i !== idx))
  }

  const handleMoveStep = (idx: number, dir: 'up' | 'down') => {
    setEditSteps(prev => {
      const arr = [...prev]
      const target = dir === 'up' ? idx - 1 : idx + 1
      if (target < 0 || target >= arr.length) return arr
      ;[arr[idx], arr[target]] = [arr[target], arr[idx]]
      return arr
    })
  }

  if (loading) return (
    <div className="flex flex-col min-h-dvh pb-20">
      <header className="glass-nav w-full h-16">
        <Layout className="flex flex-col justify-center h-full">
          <h2 className="text-lg font-semibold text-gray-800">오늘의 루틴</h2>
        </Layout>
      </header>
      <RoutinePageSkeleton />
    </div>
  )

  return (
    <div className="flex flex-col min-h-dvh pb-20">
      <header className="glass-nav w-full h-16">
        <Layout className="flex flex-col justify-center h-full">
          <div className="flex items-center justify-between w-full">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">오늘의 루틴</h2>
              <p className="text-sm text-gray-400 mt-0.5">{todayLabel}</p>
            </div>
            {routine && (
              <button
                onClick={() => { if (!editMode) setEditSteps([...routine.steps]); setEditMode(e => !e) }}
                className="text-xs px-3 py-1.5 rounded-full font-medium transition-all"
                style={{ background: editMode ? 'rgba(239,68,68,0.1)' : 'rgba(137,188,226,0.15)', color: editMode ? '#EF4444' : '#5A9AC8' }}
                aria-label={editMode ? '편집 취소' : '루틴 편집'}
              >
                {editMode ? '취소' : '편집'}
              </button>
            )}
          </div>
        </Layout>
      </header>

      <Layout className="pt-6">
        {/* 편집 모드 */}
        {editMode && routine && (
          <div className="flex flex-col gap-3 mb-6">
            <p className="text-sm font-semibold text-gray-700">루틴 편집</p>
            {editSteps.map((step, idx) => (
              <div key={idx} className="glass-card rounded-2xl p-4 flex items-center gap-3">
                <div className="flex flex-col gap-1">
                  <button onClick={() => handleMoveStep(idx, 'up')} disabled={idx === 0} className="text-gray-300 disabled:opacity-30 leading-none" aria-label="위로">▲</button>
                  <button onClick={() => handleMoveStep(idx, 'down')} disabled={idx === editSteps.length - 1} className="text-gray-300 disabled:opacity-30 leading-none" aria-label="아래로">▼</button>
                </div>
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0" style={{ background: 'rgba(137,188,226,0.2)', color: '#5A9AC8' }}>{idx + 1}</div>
                <div className="flex-1">
                  <input
                    value={step.name}
                    onChange={e => setEditSteps(prev => prev.map((s, i) => i === idx ? { ...s, name: e.target.value } : s))}
                    className="input-field w-full"
                    style={{ height: 36, fontSize: 13 }}
                    aria-label={`${idx + 1}번 단계 이름`}
                  />
                </div>
                <button onClick={() => handleDeleteStep(idx)} className="text-red-300 hover:text-red-400 transition-colors flex-shrink-0" aria-label="단계 삭제">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
              </div>
            ))}
            <div className="flex gap-2">
              <input
                value={newStepName}
                onChange={e => setNewStepName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddStep()}
                placeholder="새 단계 이름 입력"
                className="input-field flex-1"
                style={{ height: 44, fontSize: 13 }}
                aria-label="새 단계 이름"
              />
              <button onClick={handleAddStep} disabled={!newStepName.trim()} className="px-4 h-11 rounded-2xl text-sm font-medium text-white disabled:opacity-40" style={{ background: 'rgba(137,188,226,0.85)' }} aria-label="단계 추가">추가</button>
            </div>
            <button onClick={handleEditSave} disabled={savingEdit || editSteps.length === 0} className="btn-primary">
              {savingEdit ? '저장 중...' : '루틴 저장하기'}
            </button>
          </div>
        )}

        {routine ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {/* 왼쪽: 진행률 */}
            <div className="flex flex-col gap-4">
              <div className="glass-card rounded-2xl p-5">
                <div className="flex justify-between items-center mb-3">
                  <p className="text-sm font-semibold text-gray-700">오늘의 진행률</p>
                  <p className="text-sm font-semibold" style={{ color: '#89BCE2' }}>{checkedCount} / {totalCount}</p>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${progress}%` }} />
                </div>
                <p className="text-xs text-gray-400 mt-2 text-right">{progress}%</p>
              </div>

              {isAllDone && (
                <div className="glass-card rounded-2xl p-4 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(137,188,226,0.2)', backdropFilter: 'blur(10px)' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5A9AC8" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M20 6L9 17L4 12"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: '#3A7AAE' }}>오늘 루틴 완료!</p>
                    <p className="text-xs mt-0.5" style={{ color: '#89BCE2' }}>훌륭해요. 내일도 함께해요 🌿</p>
                  </div>
                </div>
              )}
            </div>

            {/* 오른쪽: 체크리스트 */}
            <div className="flex flex-col gap-3">
              {routine.steps.map((step, idx) => {
                const isDone = checks[idx] || false
                const isExpanded = expanded === idx
                const hasTip = !!step.tip
                const hasDesc = !!step.description

                return (
                  <div key={idx} className="glass-card rounded-2xl overflow-hidden transition-all"
                    style={isDone ? { background: 'rgba(211,232,245,0.35)', border: '1px solid rgba(137,188,226,0.3)' } : {}}>
                    <div className="flex items-center gap-4 p-4">
                      <button
                        onClick={() => handleCheck(idx)}
                        className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
                        style={{
                          background: isDone ? 'rgba(137,188,226,0.85)' : 'rgba(255,255,255,0.4)',
                          border: isDone ? 'none' : '1.5px solid rgba(181,213,238,0.6)',
                          backdropFilter: 'blur(8px)',
                        }}>
                        {isDone && (
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round">
                            <path d="M20 6L9 17L4 12"/>
                          </svg>
                        )}
                      </button>

                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400">{step.step}단계</span>
                          <span className={`text-sm font-medium ${isDone ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                            {step.name}
                          </span>
                        </div>
                        {step.product && (
                          <p className="text-xs text-gray-400 mt-0.5">{step.product}</p>
                        )}
                        {step.product_memo && (
                          <p className="text-xs mt-0.5" style={{ color: '#89BCE2' }}>📌 {step.product_memo}</p>
                        )}
                      </div>

                      {(hasTip || hasDesc) && (
                        <button
                          onClick={() => setExpanded(isExpanded ? null : idx)}
                          className="w-6 h-6 flex items-center justify-center flex-shrink-0 rounded-full transition-all"
                          style={{ background: 'rgba(234,243,250,0.5)', backdropFilter: 'blur(8px)' }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#8BADC8" strokeWidth="2.5" strokeLinecap="round"
                            style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                            <path d="M6 9l6 6 6-6"/>
                          </svg>
                        </button>
                      )}
                    </div>

                    {isExpanded && (hasTip || hasDesc) && (
                      <div className="px-4 pb-4 flex flex-col gap-2 border-t border-white/20">
                        {hasDesc && (
                          <p className="text-xs text-gray-500 leading-relaxed pt-3">
                            {step.description}
                          </p>
                        )}
                        {hasTip && (
                          <div className="rounded-xl px-3 py-2" style={{ background: 'rgba(234,243,250,0.5)', backdropFilter: 'blur(10px)' }}>
                            <p className="text-xs leading-relaxed" style={{ color: '#5A9AC8' }}>
                              <span className="font-semibold">Tip. </span>
                              {step.tip}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-16 h-16 rounded-full flex items-center justify-center glass-card">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#89BCE2" strokeWidth="1.8" strokeLinecap="round">
                <path d="M9 11L12 14L22 4"/><path d="M21 12V19A2 2 0 0119 21H5A2 2 0 013 19V5A2 2 0 015 3H16"/>
              </svg>
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-gray-600">아직 루틴이 없어요</p>
              <p className="text-xs text-gray-400 mt-1">피부 진단 후 맞춤 루틴이 생성돼요</p>
            </div>
            <button onClick={() => navigate('/diagnosis')}
              className="btn-primary" style={{ width: 'auto', padding: '0 28px' }}>
              지금 진단하기
            </button>
          </div>
        )}
      </Layout>
    </div>
  )
}
