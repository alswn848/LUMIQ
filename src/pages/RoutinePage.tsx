import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout'
import { toast } from '../components/Toast'
import { RoutinePageSkeleton } from '../components/Skeleton'
import type { Routine, RoutineCheck, RoutineStep, RoutineSteps } from '../types'

const NIGHT_OFFSET = 100

function getSteps(routine: Routine): { morning: RoutineStep[]; night: RoutineStep[] } {
  if (Array.isArray(routine.steps)) {
    return { morning: routine.steps as RoutineStep[], night: [] }
  }
  const s = routine.steps as RoutineSteps
  return { morning: s.morning || [], night: s.night || [] }
}

export default function RoutinePage() {
  const navigate = useNavigate()
  const [routine, setRoutine] = useState<Routine | null>(null)
  const [checks, setChecks] = useState<Record<number, boolean>>({})
  const [expanded, setExpanded] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [editMode, setEditMode] = useState(false)
  const [editMorning, setEditMorning] = useState<RoutineStep[]>([])
  const [editNight, setEditNight] = useState<RoutineStep[]>([])
  const [savingEdit, setSavingEdit] = useState(false)
  const [newMorningName, setNewMorningName] = useState('')
  const [newNightName, setNewNightName] = useState('')
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

  useEffect(() => { fetchRoutine() }, [fetchRoutine])

  const handleCheck = async (stepIndex: number, stepName: string) => {
    if (!routine) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { morning, night } = getSteps(routine)
    const totalCount = morning.length + night.length
    const newValue = !checks[stepIndex]

    setChecks(prev => {
      const updated = { ...prev, [stepIndex]: newValue }
      const doneCount = Object.values(updated).filter(Boolean).length
      if (doneCount === totalCount) {
        setTimeout(() => toast('🎉 오늘 루틴 완료! 훌륭해요', 'success'), 300)
      }
      return updated
    })

    if (newValue) toast(`${stepName} 완료!`, 'success')

    const { error } = await supabase.from('routine_checks').upsert({
      user_id: user.id, routine_id: routine.id,
      checked_at: today, step_index: stepIndex, is_done: newValue,
    }, { onConflict: 'routine_id,checked_at,step_index' })

    if (error) {
      setChecks(prev => ({ ...prev, [stepIndex]: !newValue }))
      toast('저장에 실패했어요', 'error')
    }
  }

  const handleEditSave = async () => {
    if (!routine) return
    setSavingEdit(true)
    try {
      const morning = editMorning.map((s, i) => ({ ...s, step: i + 1 }))
      const night = editNight.map((s, i) => ({ ...s, step: i + 1 }))
      const { error } = await supabase.from('routines').update({ steps: { morning, night } }).eq('id', routine.id)
      if (error) throw error
      setRoutine({ ...routine, steps: { morning, night } })
      setEditMode(false)
      toast('루틴이 수정됐어요!', 'success')
    } catch {
      toast('저장에 실패했어요', 'error')
    } finally { setSavingEdit(false) }
  }

  const addStep = (type: 'morning' | 'night') => {
    const name = type === 'morning' ? newMorningName.trim() : newNightName.trim()
    if (!name) return
    const next: RoutineStep = { step: 0, name, product: '', description: '', tip: '' }
    if (type === 'morning') { setEditMorning(prev => [...prev, next]); setNewMorningName('') }
    else { setEditNight(prev => [...prev, next]); setNewNightName('') }
  }

  const deleteStep = (type: 'morning' | 'night', idx: number) => {
    if (type === 'morning') setEditMorning(prev => prev.filter((_, i) => i !== idx))
    else setEditNight(prev => prev.filter((_, i) => i !== idx))
  }

  const moveStep = (type: 'morning' | 'night', idx: number, dir: 'up' | 'down') => {
    const setter = type === 'morning' ? setEditMorning : setEditNight
    setter(prev => {
      const arr = [...prev]
      const target = dir === 'up' ? idx - 1 : idx + 1
      if (target < 0 || target >= arr.length) return arr
      ;[arr[idx], arr[target]] = [arr[target], arr[idx]]
      return arr
    })
  }

  const renameStep = (type: 'morning' | 'night', idx: number, name: string) => {
    const setter = type === 'morning' ? setEditMorning : setEditNight
    setter(prev => prev.map((s, i) => i === idx ? { ...s, name } : s))
  }

  const steps = routine ? getSteps(routine) : null
  const morningCount = steps?.morning.length || 0
  const nightCount = steps?.night.length || 0
  const totalCount = morningCount + nightCount
  const checkedCount = Object.values(checks).filter(Boolean).length
  const progress = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0
  const isAllDone = totalCount > 0 && checkedCount === totalCount

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

  const renderStepList = (
    stepList: RoutineStep[],
    type: 'morning' | 'night',
    indexOffset: number
  ) => stepList.map((step, idx) => {
    const stepIndex = indexOffset + idx
    const isDone = checks[stepIndex] || false
    const key = `${type}_${idx}`
    const isExpanded = expanded === key
    const hasTip = !!step.tip
    const hasDesc = !!step.description

    return (
      <div key={key} className="glass-card rounded-2xl overflow-hidden transition-all"
        style={isDone ? { background: 'rgba(211,232,245,0.35)', border: '1px solid rgba(137,188,226,0.3)' } : {}}>
        <div className="flex items-center gap-4 p-4">
          <button
            onClick={() => handleCheck(stepIndex, step.name)}
            className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
            style={{
              background: isDone ? 'rgba(137,188,226,0.85)' : 'rgba(255,255,255,0.4)',
              border: isDone ? 'none' : '1.5px solid rgba(181,213,238,0.6)',
              backdropFilter: 'blur(8px)',
            }}
            aria-label={`${step.name} 체크`}>
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
            {step.product && <p className="text-xs text-gray-400 mt-0.5">{step.product}</p>}
            {step.product_memo && (
              <p className="text-xs mt-0.5" style={{ color: '#89BCE2' }}>📌 {step.product_memo}</p>
            )}
          </div>

          {(hasTip || hasDesc) && (
            <button
              onClick={() => setExpanded(isExpanded ? null : key)}
              className="w-6 h-6 flex items-center justify-center flex-shrink-0 rounded-full transition-all"
              style={{ background: 'rgba(234,243,250,0.5)', backdropFilter: 'blur(8px)' }}
              aria-label="상세 보기">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#8BADC8" strokeWidth="2.5" strokeLinecap="round"
                style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                <path d="M6 9l6 6 6-6"/>
              </svg>
            </button>
          )}
        </div>

        {isExpanded && (hasTip || hasDesc) && (
          <div className="px-4 pb-4 flex flex-col gap-2 border-t border-white/20">
            {hasDesc && <p className="text-xs text-gray-500 leading-relaxed pt-3">{step.description}</p>}
            {hasTip && (
              <div className="rounded-xl px-3 py-2" style={{ background: 'rgba(234,243,250,0.5)', backdropFilter: 'blur(10px)' }}>
                <p className="text-xs leading-relaxed" style={{ color: '#5A9AC8' }}>
                  <span className="font-semibold">Tip. </span>{step.tip}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    )
  })

  const renderEditList = (
    editList: RoutineStep[],
    type: 'morning' | 'night',
    newName: string,
    setNewName: (v: string) => void
  ) => (
    <div className="flex flex-col gap-2">
      {editList.map((step, idx) => (
        <div key={idx} className="glass-card rounded-2xl p-4 flex items-center gap-3">
          <div className="flex flex-col gap-1">
            <button onClick={() => moveStep(type, idx, 'up')} disabled={idx === 0} className="text-gray-300 disabled:opacity-30 leading-none" aria-label="위로">▲</button>
            <button onClick={() => moveStep(type, idx, 'down')} disabled={idx === editList.length - 1} className="text-gray-300 disabled:opacity-30 leading-none" aria-label="아래로">▼</button>
          </div>
          <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
            style={{ background: 'rgba(137,188,226,0.2)', color: '#5A9AC8' }}>{idx + 1}</div>
          <div className="flex-1">
            <input
              value={step.name}
              onChange={e => renameStep(type, idx, e.target.value)}
              className="input-field w-full"
              style={{ height: 36, fontSize: 13 }}
              aria-label={`${idx + 1}번 단계 이름`}
            />
          </div>
          <button onClick={() => deleteStep(type, idx)} className="text-red-300 hover:text-red-400 transition-colors flex-shrink-0" aria-label="단계 삭제">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
      ))}
      <div className="flex gap-2">
        <input
          value={newName}
          onChange={e => setNewName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addStep(type)}
          placeholder="새 단계 이름 입력"
          className="input-field flex-1"
          style={{ height: 44, fontSize: 13 }}
        />
        <button onClick={() => addStep(type)} disabled={!newName.trim()} className="px-4 h-11 rounded-2xl text-sm font-medium text-white disabled:opacity-40" style={{ background: 'rgba(137,188,226,0.85)' }}>추가</button>
      </div>
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
                onClick={() => {
                  if (!editMode && steps) {
                    setEditMorning([...steps.morning])
                    setEditNight([...steps.night])
                  }
                  setEditMode(e => !e)
                }}
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
          <div className="flex flex-col gap-5 mb-6">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F0B860" strokeWidth="2" strokeLinecap="round">
                  <circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
                </svg>
                <p className="text-sm font-semibold text-gray-700">모닝케어 편집</p>
              </div>
              {renderEditList(editMorning, 'morning', newMorningName, setNewMorningName)}
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#89BCE2" strokeWidth="2" strokeLinecap="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
                <p className="text-sm font-semibold text-gray-700">나이트케어 편집</p>
              </div>
              {renderEditList(editNight, 'night', newNightName, setNewNightName)}
            </div>

            <button onClick={handleEditSave} disabled={savingEdit || (editMorning.length === 0 && editNight.length === 0)} className="btn-primary">
              {savingEdit ? '저장 중...' : '루틴 저장하기'}
            </button>
          </div>
        )}

        {routine && steps ? (
          <div className="flex flex-col gap-6">
            {/* 진행률 */}
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

            {/* 모닝케어 */}
            {steps.morning.length > 0 && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#F0B860" strokeWidth="2" strokeLinecap="round">
                    <circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
                  </svg>
                  <p className="text-sm font-semibold text-gray-700">모닝케어</p>
                  <span className="text-xs text-gray-400">
                    {steps.morning.filter((_, i) => checks[i]).length}/{steps.morning.length}
                  </span>
                </div>
                {renderStepList(steps.morning, 'morning', 0)}
              </div>
            )}

            {/* 나이트케어 */}
            {steps.night.length > 0 && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#89BCE2" strokeWidth="2" strokeLinecap="round">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                  </svg>
                  <p className="text-sm font-semibold text-gray-700">나이트케어</p>
                  <span className="text-xs text-gray-400">
                    {steps.night.filter((_, i) => checks[NIGHT_OFFSET + i]).length}/{steps.night.length}
                  </span>
                </div>
                {renderStepList(steps.night, 'night', NIGHT_OFFSET)}
              </div>
            )}
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
