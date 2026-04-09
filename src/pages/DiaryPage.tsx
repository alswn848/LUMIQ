import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout'
import { toast } from '../components/Toast'
import { DiaryPageSkeleton } from '../components/Skeleton'
import type { DiaryEntry } from '../types'

const CONDITION_COLORS = ['', '#F09090', '#F0B880', '#F0D870', '#7ECBA0', '#89BCE2']

function ConditionIcon({ value, active }: { value: number; active: boolean }) {
  const color = active ? CONDITION_COLORS[value] : '#C8D8E8'
  const size = 28

  const icons = [
    null,
    // 1 — 물방울 비어있음 (윤곽선만)
    <svg key={1} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2C12 2 5 10 5 15a7 7 0 0014 0C19 10 12 2 12 2z"/>
    </svg>,
    // 2 — 물방울 25% 채움
    <svg key={2} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2C12 2 5 10 5 15a7 7 0 0014 0C19 10 12 2 12 2z"/>
      <path d="M7.5 18.5 Q12 20 16.5 18.5" strokeWidth="1.4"/>
    </svg>,
    // 3 — 물방울 50% 채움
    <svg key={3} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2C12 2 5 10 5 15a7 7 0 0014 0C19 10 12 2 12 2z"/>
      <path d="M6.5 16 Q12 18.5 17.5 16" strokeWidth="1.4"/>
    </svg>,
    // 4 — 물방울 75% 채움
    <svg key={4} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2C12 2 5 10 5 15a7 7 0 0014 0C19 10 12 2 12 2z"/>
      <path d="M6 13.5 Q12 16.5 18 13.5" strokeWidth="1.4"/>
    </svg>,
    // 5 — 물방울 꽉 참 + 반짝이
    <svg key={5} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2C12 2 5 10 5 15a7 7 0 0014 0C19 10 12 2 12 2z" fill={`${color}30`}/>
      <path d="M9 14.5 Q12 13 15 14.5" strokeWidth="1.4"/>
      <path d="M19 5l.5-1.5.5 1.5 1.5.5-1.5.5-.5 1.5-.5-1.5-1.5-.5z" strokeWidth="1.2"/>
    </svg>,
  ]

  return <>{icons[value]}</>
}

const CONDITIONS = [
  { value: 1, label: '매우 나쁨' },
  { value: 2, label: '나쁨' },
  { value: 3, label: '보통' },
  { value: 4, label: '좋음' },
  { value: 5, label: '매우 좋음' },
]

export default function DiaryPage() {
  const today = new Date().toISOString().split('T')[0]
  const [condition, setCondition] = useState<number>(0)
  const [memo, setMemo] = useState('')
  const [saving, setSaving] = useState(false)
  const [entries, setEntries] = useState<DiaryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [todayEntry, setTodayEntry] = useState<DiaryEntry | null>(null)

  const fetchEntries = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('skin_diary')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(30)
      if (error) throw error

      setEntries(data || [])
      const entry = (data || []).find(e => e.date === today)
      if (entry) {
        setTodayEntry(entry)
        setCondition(entry.condition)
        setMemo(entry.memo || '')
      }
    } catch {
      toast('일기를 불러오는데 실패했어요', 'error')
    } finally {
      setLoading(false)
    }
  }, [today])

  useEffect(() => { fetchEntries() }, [fetchEntries])

  const handleSave = async () => {
    if (!condition) { toast('오늘 피부 컨디션을 선택해주세요', 'error'); return }
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase.from('skin_diary').upsert({
        user_id: user.id,
        date: today,
        condition,
        memo: memo.trim() || null,
      }, { onConflict: 'user_id,date' })
      if (error) throw error
      toast('일기가 저장됐어요!', 'success')
      await fetchEntries()
    } catch {
      toast('저장에 실패했어요', 'error')
    } finally {
      setSaving(false)
    }
  }

  const todayLabel = new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })

  const getConditionColor = (val: number) => {
    const map: Record<number, string> = { 1: '#F09090', 2: '#F0B880', 3: '#F0D880', 4: '#90D0A0', 5: '#89BCE2' }
    return map[val] || '#B5D5EE'
  }

  if (loading) return (
    <div className="flex flex-col min-h-dvh pb-20">
      <header className="glass-nav w-full h-16">
        <Layout className="flex flex-col justify-center h-full">
          <h2 className="text-lg font-semibold text-gray-800">피부 일기</h2>
        </Layout>
      </header>
      <DiaryPageSkeleton />
    </div>
  )

  return (
    <div className="flex flex-col min-h-dvh pb-20">
      <header className="glass-nav w-full h-16">
        <Layout className="flex flex-col justify-center h-full">
          <h2 className="text-lg font-semibold text-gray-800">피부 일기</h2>
          <p className="text-sm text-gray-400 mt-0.5">{todayLabel}</p>
        </Layout>
      </header>

      <Layout className="pt-6 flex flex-col gap-5">
        {/* 오늘 입력 카드 */}
        <div className="glass-card rounded-2xl p-5 flex flex-col gap-4">
          <p className="text-sm font-semibold text-gray-700">오늘 피부 컨디션</p>

          <div className="flex justify-around">
            {CONDITIONS.map(c => (
              <button
                key={c.value}
                onClick={() => setCondition(c.value)}
                className="flex flex-col items-center gap-1.5 transition-all"
                aria-label={c.label}
              >
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-2xl transition-all"
                  style={{
                    background: condition === c.value ? `${getConditionColor(c.value)}30` : 'rgba(234,243,250,0.4)',
                    border: condition === c.value ? `2px solid ${getConditionColor(c.value)}` : '2px solid transparent',
                    transform: condition === c.value ? 'scale(1.15)' : 'scale(1)',
                  }}
                >
                  <ConditionIcon value={c.value} active={condition === c.value} />
                </div>
                <span className="text-xs text-gray-400">{c.label}</span>
              </button>
            ))}
          </div>

          <textarea
            value={memo}
            onChange={e => setMemo(e.target.value)}
            placeholder="오늘 피부 상태를 자유롭게 기록해보세요 (선택)"
            rows={3}
            className="w-full px-4 py-3 rounded-2xl text-sm text-gray-700 outline-none resize-none leading-relaxed"
            style={{ background: 'rgba(234,243,250,0.4)', backdropFilter: 'blur(10px)', border: '1.5px solid rgba(255,255,255,0.65)' }}
          />

          <button
            onClick={handleSave}
            disabled={saving || !condition}
            className="btn-primary"
            aria-label="오늘 일기 저장"
          >
            {saving ? '저장 중...' : todayEntry ? '오늘 일기 수정하기' : '오늘 일기 저장하기'}
          </button>
        </div>

        {/* 과거 기록 */}
        {entries.filter(e => e.date !== today).length > 0 && (
          <div className="flex flex-col gap-3">
            <p className="text-sm font-semibold text-gray-700">최근 기록</p>
            {entries.filter(e => e.date !== today).map(entry => {
              const c = CONDITIONS.find(c => c.value === entry.condition)
              return (
                <div key={entry.id} className="glass-card rounded-2xl p-4 flex items-center gap-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `${getConditionColor(entry.condition)}20` }}
                  >
                    <ConditionIcon value={entry.condition} active={true} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-700">{c?.label}</p>
                      <span className="text-xs text-gray-400">
                        {new Date(entry.date).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })}
                      </span>
                    </div>
                    {entry.memo && (
                      <p className="text-xs text-gray-400 mt-0.5 truncate">{entry.memo}</p>
                    )}
                  </div>
                  <div className="flex gap-0.5">
                    {[1,2,3,4,5].map(i => (
                      <div
                        key={i}
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ background: i <= entry.condition ? getConditionColor(entry.condition) : 'rgba(181,213,238,0.3)' }}
                      />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {entries.length === 0 && (
          <div className="flex flex-col items-center py-12 gap-3">
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#B5D5EE" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
              <line x1="9" y1="7" x2="15" y2="7"/>
              <line x1="9" y1="11" x2="15" y2="11"/>
            </svg>
            <p className="text-sm text-gray-400">첫 번째 피부 일기를 작성해보세요</p>
          </div>
        )}
      </Layout>
    </div>
  )
}
