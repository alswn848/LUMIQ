import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import LumiqLogo from '../components/LumiqLogo'

export default function AuthCallbackPage() {
  const navigate = useNavigate()

  useEffect(() => {
    const handleCallback = async () => {
      const { data, error } = await supabase.auth.exchangeCodeForSession(window.location.href)
      if (error || !data.session) { navigate('/login'); return }

      const { data: profile } = await supabase
        .from('user_profiles').select('id').eq('user_id', data.session.user.id).maybeSingle()
      navigate(profile ? '/' : '/onboarding', { replace: true })
    }
    handleCallback()
  }, [navigate])

  return (
    <div className="flex flex-col items-center justify-center min-h-dvh gap-4">
      <LumiqLogo size="md" />
      <p className="text-sm text-gray-400 animate-pulse">인증 확인 중...</p>
    </div>
  )
}