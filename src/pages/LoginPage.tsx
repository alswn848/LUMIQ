// LoginPage.tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import LumiqLogo from '../components/LumiqLogo'
import Layout from '../components/Layout'

export default function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null); setMessage(null); setLoading(true)
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: `${window.location.origin}/auth/callback` }
        })
        if (error) throw error
        setMessage('가입 확인 이메일을 보냈어요! 메일함을 확인하고 링크를 클릭해주세요.')
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        if (data.user) {
          const { data: profile } = await supabase
            .from('user_profiles').select('id').eq('user_id', data.user.id).maybeSingle()
          navigate(profile ? '/' : '/onboarding')
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했어요.')
    } finally { setLoading(false) }
  }

  return (
    <div className="flex flex-col min-h-dvh">
      <Layout className="flex flex-col flex-1">
        <div className="flex flex-col items-center justify-center flex-1 py-16">
          <div className="fade-in mb-12"><LumiqLogo size="lg" /></div>
          <div className="w-full max-w-sm glass-modal rounded-3xl p-7 fade-in fade-in-delay-1">
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-gray-400 font-medium px-1">이메일</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="example@email.com" required className="input-field" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-gray-400 font-medium px-1">비밀번호</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="6자 이상 입력" required minLength={6} className="input-field" />
              </div>
              {error && <p className="text-xs text-red-400 px-4 py-3 rounded-xl" style={{ background: 'rgba(255,240,243,0.7)', backdropFilter: 'blur(10px)' }}>{error}</p>}
              {message && <p className="text-xs px-4 py-3 rounded-xl" style={{ color: '#5A9AC8', background: 'rgba(234,243,250,0.7)', backdropFilter: 'blur(10px)' }}>{message}</p>}
              <div className="flex flex-col gap-2 mt-2">
                <button type="submit" disabled={loading} className="btn-primary">
                  {loading ? '처리 중...' : isSignUp ? '회원가입' : '로그인'}
                </button>
                <button type="button" onClick={() => { setIsSignUp(!isSignUp); setError(null); setMessage(null) }} className="btn-secondary">
                  {isSignUp ? '이미 계정이 있어요' : '계정이 없어요'}
                </button>
              </div>
            </form>
          </div>
        </div>
        <p className="text-center text-xs text-gray-300 pb-8">피부에게 딱 맞는 루틴을 찾아드릴게요</p>
      </Layout>
    </div>
  )
}
