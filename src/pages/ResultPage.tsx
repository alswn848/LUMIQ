import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout'
import { toast } from '../components/Toast'
import { SKIN_COLOR } from '../lib/skinColors'
import type { AISkinResult } from '../types'

type TabType = 'result' | 'routine' | 'clinic'

export default function ResultPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as { result: AISkinResult; diagnosisId: string } | null
  const [activeTab, setActiveTab] = useState<TabType>('result')
  const [memos, setMemos] = useState<Record<number, string>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!state) navigate('/', { replace: true })
  }, [state, navigate])

  if (!state) return null

  const { result, diagnosisId } = state
  const hasClinic = !!result.clinicTreatments?.length
  const color = SKIN_COLOR[result.skinType] || SKIN_COLOR['복합성']

  const tabs = [
    { id: 'result' as TabType,  label: '진단 결과' },
    { id: 'routine' as TabType, label: '루틴' },
    ...(hasClinic ? [{ id: 'clinic' as TabType, label: '피부과 시술' }] : []),
  ]

  const handleSave = async () => {
    setSaving(true)
    try {
      const updatedSteps = result.routine.map(step => ({
        ...step, product_memo: memos[step.step] || '',
      }))
      const { error } = await supabase.from('routines').update({ steps: updatedSteps }).eq('diagnosis_id', diagnosisId)
      if (error) throw error
      toast('루틴이 저장됐어요!', 'success')
      setTimeout(() => navigate('/routine'), 500)
    } catch {
      toast('저장에 실패했어요', 'error')
    } finally { setSaving(false) }
  }

  return (
    <div className="flex flex-col min-h-dvh pb-28">
      {/* 헤더 */}
      <header className="glass-nav w-full h-16">
        <Layout className="flex flex-col justify-center h-full">
          <button onClick={() => navigate('/diagnosis')}
            className="text-sm text-gray-400 mb-1 flex items-center gap-1.5 w-fit">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
            다시 진단하기
          </button>
          <h2 className="text-lg font-semibold text-gray-800">AI 분석 완료</h2>
        </Layout>
      </header>

      {/* 피부 타입 요약 카드 */}
      <div className="w-full" style={{ background: color.bg, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.4)' }}>
        <Layout className="py-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium mb-0.5" style={{ color: color.text, opacity: 0.6 }}>내 피부 타입</p>
              <p className="text-2xl font-semibold" style={{ color: color.text }}>{result.skinType} 피부</p>
            </div>
            <div className="flex gap-2 flex-wrap justify-end">
              {result.warnings.slice(0, 3).map(w => (
                <span key={w} className="text-xs px-2.5 py-1 rounded-full font-medium"
                  style={{ background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(10px)', color: color.text }}>
                  {w} 주의
                </span>
              ))}
            </div>
          </div>
        </Layout>
      </div>

      {/* 탭 */}
      <div className="w-full glass-nav sticky top-0 z-10" style={{ position: 'sticky', top: 0, zIndex: 10 }}>
        <Layout className="flex">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex-1 py-3 text-sm font-medium transition-all relative"
              style={{ color: activeTab === tab.id ? color.text : '#8BADC8' }}
            >
              {tab.label}
              {tab.id === 'clinic' && (
                <span className="ml-1 text-xs px-1.5 py-0.5 rounded-full"
                  style={{ background: '#FDE68A', color: '#92400E' }}>NEW</span>
              )}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                  style={{ background: color.text }} />
              )}
            </button>
          ))}
        </Layout>
      </div>

      {/* 탭 콘텐츠 */}
      <Layout className="pt-5 pb-6">

        {/* 탭 1: 진단 결과 */}
        {activeTab === 'result' && (
          <div className="flex flex-col gap-4 fade-in">
            <div className="glass-card rounded-2xl p-5">
              <p className="text-sm font-semibold text-gray-700 mb-2">진단 이유</p>
              <p className="text-sm text-gray-500 leading-relaxed">{result.reason}</p>
            </div>

            {result.characteristics?.length > 0 && (
              <div className="glass-card rounded-2xl p-5">
                <p className="text-sm font-semibold text-gray-700 mb-3">이 피부 타입의 특징</p>
                <div className="flex flex-col gap-2">
                  {result.characteristics.map((c, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                        style={{ background: color.badge }} />
                      <p className="text-sm text-gray-600 leading-relaxed">{c}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.recommendedIngredients?.length > 0 && (
              <div className="glass-card rounded-2xl p-5">
                <p className="text-sm font-semibold text-gray-700 mb-3">이 피부에 좋은 성분</p>
                <div className="flex flex-col gap-3">
                  {result.recommendedIngredients.map((ing, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <span className="text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0"
                        style={{ background: 'rgba(255,255,255,0.5)', backdropFilter: 'blur(8px)', color: color.text }}>{ing.name}</span>
                      <p className="text-xs text-gray-500 leading-relaxed mt-0.5">{ing.reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="glass-card rounded-2xl p-5">
              <p className="text-sm font-semibold text-gray-700 mb-3">피해야 할 성분</p>
              <div className="flex flex-wrap gap-2">
                {result.warnings.map(w => (
                  <span key={w} className="text-xs px-3 py-1.5 rounded-full font-medium"
                    style={{ background: 'rgba(255,240,243,0.7)', backdropFilter: 'blur(8px)', color: '#D06080' }}>{w}</span>
                ))}
              </div>
            </div>

            {result.lifestyle?.length > 0 && (
              <div className="glass-card rounded-2xl p-5">
                <p className="text-sm font-semibold text-gray-700 mb-3">생활 습관 조언</p>
                <div className="flex flex-col gap-2.5">
                  {result.lifestyle.map((tip, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span style={{ fontSize: 14, flexShrink: 0 }}>💡</span>
                      <p className="text-sm text-gray-600 leading-relaxed">{tip}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button onClick={() => setActiveTab('routine')} className="btn-primary">
              루틴 보기 →
            </button>
          </div>
        )}

        {/* 탭 2: 루틴 */}
        {activeTab === 'routine' && (
          <div className="flex flex-col gap-3 fade-in">
            <p className="text-sm text-gray-400">각 단계에 사용 중인 제품을 메모해보세요</p>
            {result.routine.map(step => (
              <div key={step.step} className="glass-card rounded-2xl p-4">
                <div className="flex items-start gap-2.5 mb-2">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-semibold mt-0.5"
                    style={{ background: 'rgba(255,255,255,0.5)', backdropFilter: 'blur(8px)', color: color.text }}>
                    {step.step}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-700">{step.name}</p>
                    <p className="text-xs mt-0.5" style={{ color: color.text, opacity: 0.8 }}>{step.product}</p>
                  </div>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed mb-2">{step.description}</p>
                {step.tip && (
                  <div className="rounded-xl px-3 py-2 mb-3" style={{ background: 'rgba(255,255,255,0.4)', backdropFilter: 'blur(8px)' }}>
                    <p className="text-xs leading-relaxed" style={{ color: color.text }}>
                      <span className="font-semibold">Tip. </span>{step.tip}
                    </p>
                  </div>
                )}
                <input
                  type="text"
                  value={memos[step.step] || ''}
                  onChange={e => setMemos(prev => ({ ...prev, [step.step]: e.target.value }))}
                  placeholder="사용 중인 제품명을 메모해요 (선택)"
                  className="input-field"
                  style={{ height: '40px', fontSize: '12px' }}
                />
              </div>
            ))}
          </div>
        )}

        {/* 탭 3: 피부과 시술 */}
        {activeTab === 'clinic' && hasClinic && (
          <div className="flex flex-col gap-4 fade-in">
            {result.clinicMessage && (
              <div className="glass-card rounded-2xl p-4 flex items-start gap-3"
                style={{ border: '1px solid rgba(253,220,176,0.5)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0, marginTop: 1 }}>
                  <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
                </svg>
                <p className="text-xs text-gray-600 leading-relaxed">{result.clinicMessage}</p>
              </div>
            )}

            {result.clinicTreatments!.map((t, i) => (
              <div key={i} className="glass-card rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
                    style={{ background: 'rgba(253,220,176,0.7)', color: '#C06020' }}>{i + 1}</span>
                  <p className="text-sm font-semibold" style={{ color: '#C06020' }}>{t.name}</p>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed mb-3">{t.description}</p>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="rounded-xl p-3" style={{ background: 'rgba(255,248,240,0.6)', backdropFilter: 'blur(8px)' }}>
                    <p className="text-xs font-medium text-gray-500 mb-1">기대 효과</p>
                    <p className="text-xs text-gray-600 leading-relaxed">{t.effect}</p>
                  </div>
                  <div className="rounded-xl p-3" style={{ background: 'rgba(255,248,240,0.6)', backdropFilter: 'blur(8px)' }}>
                    <p className="text-xs font-medium text-gray-500 mb-1">권장 주기</p>
                    <p className="text-xs text-gray-600">{t.frequency}</p>
                  </div>
                </div>
                <div className="flex items-start gap-1.5 rounded-xl p-3"
                  style={{ background: 'rgba(255,240,243,0.6)', backdropFilter: 'blur(8px)' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#D06080" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0, marginTop: 1 }}>
                    <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
                  </svg>
                  <p className="text-xs leading-relaxed" style={{ color: '#A83A60' }}>{t.caution}</p>
                </div>
              </div>
            ))}

            <p className="text-xs text-gray-400 text-center pb-2">
              시술 전 반드시 피부과 전문의와 상담하세요
            </p>
          </div>
        )}
      </Layout>

      {/* 루틴 저장 버튼 */}
      {activeTab === 'routine' && (
        <div className="fixed bottom-0 left-0 w-full glass-tab">
          <Layout className="py-4">
            <button onClick={handleSave} disabled={saving} className="btn-primary">
              {saving ? '저장 중...' : '루틴 저장하고 시작하기'}
            </button>
          </Layout>
        </div>
      )}
    </div>
  )
}
