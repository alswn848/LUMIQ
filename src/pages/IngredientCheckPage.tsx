import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout'
import { toast } from '../components/Toast'
import type { AISkinResult } from '../types'

type CheckResult = 'good' | 'bad' | 'unknown'

interface IngredientResult {
  name: string
  status: CheckResult
  reason: string
}

export default function IngredientCheckPage() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [result, setResult] = useState<IngredientResult | null>(null)
  const [skinResult, setSkinResult] = useState<AISkinResult | null>(null)
  const [skinType, setSkinType] = useState('')
  const [loadingData, setLoadingData] = useState(true)
  const inputRef = useRef<HTMLInputElement>(null)

  const fetchLatestDiagnosis = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('skin_diagnoses')
        .select('ai_result, skin_type')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
      if (data && data.length > 0) {
        setSkinResult(data[0].ai_result as AISkinResult)
        setSkinType(data[0].skin_type)
      }
    } catch {
      toast('진단 정보를 불러오는데 실패했어요', 'error')
    } finally {
      setLoadingData(false)
    }
  }, [])

  useEffect(() => { fetchLatestDiagnosis() }, [fetchLatestDiagnosis])

  const handleCheck = () => {
    const q = query.trim()
    if (!q) return
    if (!skinResult) {
      setResult({ name: q, status: 'unknown', reason: '진단 기록이 없어서 정확한 분석이 어려워요. 먼저 AI 진단을 받아보세요.' })
      return
    }

    const normalize = (s: string) => s.toLowerCase().replace(/\s/g, '')
    const nq = normalize(q)

    const goodMatch = skinResult.recommendedIngredients?.find(i => normalize(i.name).includes(nq) || nq.includes(normalize(i.name)))
    if (goodMatch) {
      setResult({ name: q, status: 'good', reason: goodMatch.reason })
      return
    }

    const badMatch = skinResult.warnings?.find(w => normalize(w).includes(nq) || nq.includes(normalize(w)))
    if (badMatch) {
      setResult({ name: q, status: 'bad', reason: `${skinType} 피부에는 주의가 필요한 성분이에요.` })
      return
    }

    setResult({ name: q, status: 'unknown', reason: `${skinType} 피부 기준으로 추천/주의 목록에 없는 성분이에요. 소량 테스트 후 사용을 권장해요.` })
  }

  const statusConfig = {
    good:    { label: '추천 성분', emoji: '✅', color: '#22C55E', bg: 'rgba(240,253,244,0.8)' },
    bad:     { label: '주의 성분', emoji: '⚠️', color: '#EF4444', bg: 'rgba(254,242,242,0.8)' },
    unknown: { label: '정보 없음', emoji: '❓', color: '#6B7280', bg: 'rgba(249,250,251,0.8)' },
  }

  return (
    <div className="flex flex-col min-h-dvh pb-20">
      <header className="glass-nav w-full h-16">
        <Layout className="flex items-center gap-3 h-full">
          <button onClick={() => navigate(-1)} className="text-gray-400" aria-label="뒤로 가기">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
          </button>
          <div>
            <h2 className="text-lg font-semibold text-gray-800">성분 검색</h2>
            {skinType && <p className="text-xs text-gray-400">{skinType} 피부 기준</p>}
          </div>
        </Layout>
      </header>

      <Layout className="pt-6 flex flex-col gap-5">
        {!loadingData && !skinResult && (
          <div className="glass-card rounded-2xl p-4 flex items-start gap-3" style={{ border: '1px solid rgba(253,220,176,0.5)' }}>
            <span className="text-sm">💡</span>
            <p className="text-xs text-gray-500 leading-relaxed">
              AI 진단을 받으면 내 피부 타입에 맞는 정확한 성분 분석이 가능해요.
              <button onClick={() => navigate('/diagnosis')} className="ml-1 font-medium" style={{ color: '#89BCE2' }}>
                지금 진단하기 →
              </button>
            </p>
          </div>
        )}

        {/* 검색창 */}
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCheck()}
            placeholder="성분명을 입력해보세요 (예: 히알루론산)"
            className="input-field flex-1"
            aria-label="성분 검색"
          />
          <button
            onClick={handleCheck}
            disabled={!query.trim()}
            className="px-5 h-13 rounded-2xl text-sm font-medium text-white disabled:opacity-40 transition-all"
            style={{ background: 'linear-gradient(135deg, #89BCE2, #5A9AC8)', minWidth: 64 }}
            aria-label="검색"
          >
            검색
          </button>
        </div>

        {/* 결과 */}
        {result && (
          <div
            className="rounded-2xl p-5 flex flex-col gap-3 fade-in"
            style={{ background: statusConfig[result.status].bg, backdropFilter: 'blur(12px)', border: `1px solid ${statusConfig[result.status].color}30` }}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{statusConfig[result.status].emoji}</span>
              <div>
                <p className="text-base font-semibold" style={{ color: statusConfig[result.status].color }}>
                  {statusConfig[result.status].label}
                </p>
                <p className="text-sm font-medium text-gray-700">{result.name}</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">{result.reason}</p>
          </div>
        )}

        {/* 내 진단 기준 성분 목록 */}
        {skinResult && (
          <>
            <div className="glass-card rounded-2xl p-5 flex flex-col gap-3">
              <p className="text-sm font-semibold text-gray-700">✅ 내 피부에 좋은 성분</p>
              <div className="flex flex-wrap gap-2">
                {skinResult.recommendedIngredients?.map(i => (
                  <button
                    key={i.name}
                    onClick={() => { setQuery(i.name); setResult({ name: i.name, status: 'good', reason: i.reason }) }}
                    className="text-xs px-3 py-1.5 rounded-full font-medium transition-all"
                    style={{ background: 'rgba(34,197,94,0.1)', color: '#16A34A', border: '1px solid rgba(34,197,94,0.2)' }}
                  >
                    {i.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="glass-card rounded-2xl p-5 flex flex-col gap-3">
              <p className="text-sm font-semibold text-gray-700">⚠️ 주의해야 할 성분</p>
              <div className="flex flex-wrap gap-2">
                {skinResult.warnings?.map(w => (
                  <button
                    key={w}
                    onClick={() => { setQuery(w); setResult({ name: w, status: 'bad', reason: `${skinType} 피부에는 주의가 필요한 성분이에요.` }) }}
                    className="text-xs px-3 py-1.5 rounded-full font-medium transition-all"
                    style={{ background: 'rgba(239,68,68,0.08)', color: '#DC2626', border: '1px solid rgba(239,68,68,0.15)' }}
                  >
                    {w}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </Layout>
    </div>
  )
}
