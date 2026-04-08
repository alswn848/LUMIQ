import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { analyzeSkin, checkRepeatDiagnosis } from '../lib/groq'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout'
import { toast } from '../components/Toast'
import type { SkinTypeValue } from '../types'

export default function DiagnosisPage() {
  const navigate = useNavigate()
  const [input, setInput] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isValid = input.trim().length >= 10

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      toast('사진은 5MB 이하로 업로드해주세요', 'error')
      return
    }
    setImageFile(file)
    const reader = new FileReader()
    reader.onload = () => setImagePreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleRemoveImage = () => {
    setImageFile(null)
    setImagePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleAnalyze = async () => {
    if (!isValid || loading) return
    setError(null)
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('로그인이 필요해요')

      const { data: recentDiagnoses } = await supabase
        .from('skin_diagnoses')
        .select('skin_type')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5)

      const recentSkinTypes = (recentDiagnoses || []).map(d => d.skin_type as SkinTypeValue)
      const { isRepeat, skinType: repeatSkinType, count: repeatCount } = checkRepeatDiagnosis(recentSkinTypes)

      const result = await analyzeSkin(
        input,
        imageFile,
        isRepeat ? repeatSkinType : null,
        isRepeat ? repeatCount : 0
      )

      const { data: diagnosis, error: dbError } = await supabase
        .from('skin_diagnoses')
        .insert({
          user_id: user.id,
          skin_type: result.skinType,
          reason: result.reason,
          concerns: input,
          ai_result: result,
        })
        .select().single()
      if (dbError) throw dbError

      const { error: routineError } = await supabase.from('routines').insert({
        user_id: user.id,
        diagnosis_id: diagnosis.id,
        steps: result.routine,
      })
      if (routineError) throw routineError

      if (isRepeat) {
        toast(`${repeatCount}회 연속 동일 진단! 피부과 시술을 추천드려요`, 'info')
      } else {
        toast('AI 분석 완료!', 'success')
      }

      navigate('/result', { state: { result, diagnosisId: diagnosis.id } })

    } catch (err) {
      const message = err instanceof Error ? err.message : 'AI 분석 중 오류가 발생했어요.'
      setError(message)
      toast(imageFile ? '사진을 확인해주세요' : '분석에 실패했어요', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col min-h-dvh pb-20">
      <header className="glass-nav w-full h-16">
        <Layout className="flex flex-col justify-center h-full">
          <h2 className="text-lg font-semibold text-gray-800">피부 고민 입력</h2>
          <p className="text-sm text-gray-400 mt-0.5">사진과 함께 입력하면 더 정확해요</p>
        </Layout>
      </header>

      <Layout className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">

          {/* 왼쪽: 입력 영역 */}
          <div className="flex flex-col gap-4">

            {/* 사진 업로드 */}
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2 px-1">
                피부 사진 <span className="text-gray-400 font-normal">(선택 · 최대 5MB)</span>
              </p>
              {imagePreview ? (
                <div className="relative rounded-2xl overflow-hidden glass-card">
                  <img src={imagePreview} alt="피부 사진" className="w-full object-cover" style={{ maxHeight: 200 }} />
                  <button onClick={handleRemoveImage}
                    className="absolute top-3 right-3 w-7 h-7 rounded-full bg-black/40 flex items-center justify-center"
                    style={{ backdropFilter: 'blur(8px)' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M18 6L6 18M6 6l12 12"/>
                    </svg>
                  </button>
                  <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-full text-xs font-medium"
                    style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)', color: '#5A9AC8' }}>
                    AI 사진 분석 적용됩니다
                  </div>
                </div>
              ) : (
                <button onClick={() => fileInputRef.current?.click()}
                  className="w-full rounded-2xl flex flex-col items-center justify-center gap-2 transition-all glass-card"
                  style={{ border: '1.5px dashed rgba(181,213,238,0.5)', height: 120 }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#B5D5EE" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="3"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <path d="M21 15l-5-5L5 21"/>
                  </svg>
                  <span className="text-sm text-gray-400">사진 업로드</span>
                  <span className="text-xs text-gray-300">JPG, PNG · 5MB 이하</span>
                </button>
              )}
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp"
                onChange={handleImageChange} className="hidden" />
            </div>

            {/* 텍스트 입력 */}
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2 px-1">
                피부 고민 <span className="text-red-400">*</span>
              </p>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="예) 볼은 당기고 이마는 기름지고 트러블이 자주 나요..."
                rows={6}
                className="w-full px-4 py-4 rounded-2xl text-sm text-gray-700 outline-none resize-none leading-relaxed"
                style={{ background: 'rgba(234,243,250,0.4)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', border: '1.5px solid rgba(255,255,255,0.65)', fontFamily: 'Outfit, sans-serif', transition: 'border-color 0.2s' }}
              />
              <div className="flex justify-between items-center mt-1.5 px-1">
                <span className="text-xs" style={isValid ? { color: '#89BCE2' } : { color: '#9ca3af' }}>
                  {isValid ? '✓ 분석 준비 완료' : '최소 10자 이상 입력해주세요'}
                </span>
                <span className="text-xs text-gray-300">{input.length}자</span>
              </div>
            </div>

            {error && (
              <p className="text-xs text-red-400 px-4 py-3 rounded-xl"
                style={{ background: 'rgba(255,240,243,0.7)', backdropFilter: 'blur(10px)' }}>{error}</p>
            )}

            <button onClick={handleAnalyze} disabled={!isValid || loading} className="btn-primary">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M21 12a9 9 0 11-6.219-8.56"/>
                  </svg>
                  {imageFile ? 'AI가 사진과 고민을 분석 중...' : 'AI가 분석 중이에요...'}
                </span>
              ) : imageFile ? '사진 + 텍스트로 AI 분석' : 'AI 피부 분석 시작'}
            </button>
          </div>

          {/* 오른쪽: 가이드 */}
          <div className="flex flex-col gap-4">
            <div className="glass-card rounded-2xl p-5">
              <p className="text-sm font-semibold text-gray-700 mb-3">사진 촬영 가이드</p>
              <div className="flex flex-col gap-2.5">
                {[
                  { icon: '☀️', text: '밝은 자연광 아래에서 촬영하세요' },
                  { icon: '🤳', text: '세안 후 20-30분 뒤 촬영하면 정확해요' },
                  { icon: '📸', text: '정면에서 얼굴 전체가 나오게 찍어주세요' },
                  { icon: '🚫', text: '플래시나 필터 사용은 피해주세요' },
                ].map((g) => (
                  <div key={g.text} className="flex items-start gap-2.5">
                    <span style={{ fontSize: 14, flexShrink: 0 }}>{g.icon}</span>
                    <p className="text-xs text-gray-500 leading-relaxed">{g.text}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-card rounded-2xl p-5">
              <p className="text-sm font-semibold text-gray-700 mb-3">이런 내용을 포함하면 더 정확해요</p>
              <div className="flex flex-col gap-3">
                {['유분기 / 건조함 정도', '트러블이 자주 생기는 부위', '민감하거나 빨개지는 부위', '사용 중인 제품에 대한 반응'].map((hint, i) => (
                  <div key={hint} className={`flex items-start gap-3 fade-in fade-in-delay-${i + 1}`}>
                    <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: '#C5DFF5' }} />
                    <p className="text-sm text-gray-500 leading-relaxed">{hint}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-card rounded-2xl p-4 flex items-start gap-3"
              style={{ border: '1px solid rgba(253,220,176,0.5)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
                <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
              </svg>
              <p className="text-xs leading-relaxed" style={{ color: '#92400E' }}>
                업로드된 사진은 AI 분석에만 사용되며 저장되지 않아요.
              </p>
            </div>
          </div>
        </div>
      </Layout>
    </div>
  )
}
