import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout'
import { toast } from '../components/Toast'

const TOTAL_STEPS = 3

export default function OnboardingPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [nickname, setNickname] = useState('')
  const [skinType, setSkinType] = useState('')
  const [skinConcerns, setSkinConcerns] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const progress = (step / TOTAL_STEPS) * 100
  const concerns = ['건조함', '유분', '트러블', '민감성', '모공', '탄력', '미백', '주름']

  const toggleConcern = (c: string) =>
    setSkinConcerns(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c])

  const handleNext = async () => {
    if (step < TOTAL_STEPS) { setStep(s => s + 1); return }
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { error } = await supabase.from('user_profiles').upsert({
        user_id: user.id, nickname, skin_type: skinType, skin_concerns: skinConcerns,
      }, { onConflict: 'user_id' })
      if (error) throw error
      toast('프로필이 저장됐어요!', 'success')
      navigate('/')
    } catch { navigate('/') }
    finally { setLoading(false) }
  }

  const canNext = () => {
    if (step === 1) return nickname.trim().length > 0
    if (step === 2) return skinType !== ''
    return true
  }

  return (
    <div className="flex flex-col min-h-dvh">
      <div className="progress-bar w-full">
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>
      <div className="flex justify-end px-6 pt-4">
        <button onClick={() => navigate('/')} className="w-8 h-8 flex items-center justify-center text-gray-400">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
      </div>

      <Layout className="flex flex-col flex-1 pt-8">
        <div className="w-full max-w-sm mx-auto flex flex-col flex-1">
          {step === 1 && (
            <div className="flex flex-col gap-6 fade-in">
              <div>
                <h2 className="text-xl font-semibold text-gray-800">어떤 이름으로 부를까요?</h2>
                <p className="text-sm text-gray-400 mt-2 leading-relaxed">불러질 이름이나 호칭을 알려주세요.<br/>중복 상관없이 내 마음대로 설정할 수 있어요.</p>
              </div>
              <div className="relative">
                <input type="text" value={nickname} onChange={(e) => setNickname(e.target.value.slice(0, 12))}
                  placeholder="닉네임을 입력해주세요" maxLength={12} className={`input-field ${nickname ? 'pr-10' : ''}`} />
                {nickname && (
                  <button onClick={() => setNickname('')} className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full bg-gray-300 text-white">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
                  </button>
                )}
                <div className="text-right mt-1"><span className="text-xs text-gray-400">{nickname.length}/12</span></div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-6 fade-in">
              <div>
                <h2 className="text-xl font-semibold text-gray-800">내 피부 타입을 알려주세요</h2>
                <p className="text-sm text-gray-400 mt-2 leading-relaxed">잘 모르겠다면 가장 가까운 것을 선택해주세요.</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {['건성', '지성', '복합성', '민감성'].map((type) => (
                  <button key={type} onClick={() => setSkinType(type)}
                    className={`select-btn ${skinType === type ? 'selected' : ''}`}>{type}</button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col gap-6 fade-in">
              <div>
                <h2 className="text-xl font-semibold text-gray-800">피부 고민을 알려주세요</h2>
                <p className="text-sm text-gray-400 mt-2 leading-relaxed">해당하는 것을 모두 선택해주세요.</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {concerns.map((concern) => (
                  <button key={concern} onClick={() => toggleConcern(concern)}
                    className={`select-btn ${skinConcerns.includes(concern) ? 'selected' : ''}`}>{concern}</button>
                ))}
              </div>
            </div>
          )}

          <div className="flex-1" />
          <div className="pb-8 pt-4">
            {step === 3 && <p className="text-center text-xs text-gray-300 mb-4">마이페이지에서 언제든지 수정할 수 있어요</p>}
            <div className="flex gap-3">
              {step > 1 && <button onClick={() => setStep(s => s - 1)} className="btn-secondary" style={{ width: '30%' }}>이전</button>}
              <button onClick={handleNext} disabled={!canNext() || loading} className="btn-primary" style={{ flex: 1 }}>
                {loading ? '저장 중...' : step === TOTAL_STEPS ? '시작하기' : '다음'}
              </button>
            </div>
          </div>
        </div>
      </Layout>
    </div>
  )
}