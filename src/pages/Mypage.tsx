import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout'
import { toast } from '../components/Toast'
import type { UserProfile } from '../types'

const SKIN_TYPES = ['악건성', '건성', '수부지', '복합성', '지성', '민감성', '복합성+민감성', '건성+민감성']
const CONCERNS = ['건조함', '유분', '트러블', '민감성', '모공', '탄력', '미백', '주름']

export default function MyPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [nickname, setNickname] = useState('')
  const [skinType, setSkinType] = useState('')
  const [skinConcerns, setSkinConcerns] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteInput, setDeleteInput] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [diagnosisCount, setDiagnosisCount] = useState(0)

  useEffect(() => { fetchProfile() }, [])

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      setEmail(user.email || '')

      const { data: profile } = await supabase
        .from('user_profiles').select('*').eq('user_id', user.id).maybeSingle()
      if (profile) {
        const p = profile as UserProfile
        setNickname(p.nickname || '')
        setSkinType(p.skin_type || '')
        setSkinConcerns(p.skin_concerns || [])
      }

      const { count } = await supabase
        .from('skin_diagnoses').select('*', { count: 'exact', head: true }).eq('user_id', user.id)
      setDiagnosisCount(count || 0)
    } catch {
      toast('프로필을 불러오는데 실패했어요', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { error } = await supabase.from('user_profiles').upsert({
        user_id: user.id,
        nickname,
        skin_type: skinType,
        skin_concerns: skinConcerns,
      }, { onConflict: 'user_id' })
      if (error) throw error
      toast('프로필이 저장됐어요!', 'success')
    } catch {
      toast('저장에 실패했어요', 'error')
    } finally {
      setSaving(false) }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const handleDeleteAccount = async () => {
    if (deleteInput !== '탈퇴') return
    setDeleting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      await supabase.from('routine_checks').delete().eq('user_id', user.id)
      await supabase.from('routines').delete().eq('user_id', user.id)
      await supabase.from('skin_diagnoses').delete().eq('user_id', user.id)
      await supabase.from('user_profiles').delete().eq('user_id', user.id)

      await supabase.rpc('delete_user')
      await supabase.auth.signOut()
      navigate('/login')
    } catch {
      toast('탈퇴 처리 중 오류가 발생했어요. 관리자에게 문의해주세요.', 'error')
    } finally {
      setDeleting(false)
    }
  }

  const toggleConcern = (c: string) =>
    setSkinConcerns(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c])

  if (loading) return (
    <div className="flex items-center justify-center min-h-dvh">
      <p className="text-sm text-gray-400">불러오는 중...</p>
    </div>
  )

  return (
    <div className="flex flex-col min-h-dvh pb-20">
      <header className="glass-nav w-full h-16">
        <Layout className="flex items-center gap-3 h-full">
          <button onClick={() => navigate('/')} className="text-gray-400">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
          </button>
          <h2 className="text-lg font-semibold text-gray-800">마이페이지</h2>
        </Layout>
      </header>

      {/* 탈퇴 확인 모달 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-5"
          style={{ background: 'rgba(0,0,0,0.25)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
          onClick={() => { setShowDeleteConfirm(false); setDeleteInput('') }}>
          <div className="glass-modal w-full max-w-sm rounded-3xl p-6"
            onClick={e => e.stopPropagation()}>
            <h3 className="text-base font-semibold text-gray-800 mb-1">정말 탈퇴하시겠어요?</h3>
            <p className="text-sm text-gray-400 mb-4 leading-relaxed">
              모든 진단 기록, 루틴, 프로필이 <span className="text-red-400 font-medium">영구 삭제</span>되며 복구할 수 없어요.
            </p>
            <div className="rounded-xl p-3 mb-4" style={{ background: 'rgba(234,243,250,0.5)', backdropFilter: 'blur(8px)' }}>
              <p className="text-xs text-gray-500 mb-2">확인을 위해 <span className="font-semibold text-gray-700">탈퇴</span>를 입력해주세요</p>
              <input
                type="text"
                value={deleteInput}
                onChange={e => setDeleteInput(e.target.value)}
                placeholder="탈퇴"
                className="input-field"
                style={{ height: 40, fontSize: 13 }}
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => { setShowDeleteConfirm(false); setDeleteInput('') }}
                className="btn-secondary flex-1" style={{ height: 44 }}>
                취소
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteInput !== '탈퇴' || deleting}
                className="flex-1 h-11 rounded-xl text-sm font-medium text-white transition-all disabled:opacity-40"
                style={{ background: '#E05050' }}>
                {deleting ? '처리 중...' : '탈퇴하기'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Layout className="pt-6 flex flex-col gap-5">

        {/* 프로필 요약 */}
        <div className="glass-card rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 text-lg font-semibold text-white"
            style={{ background: 'linear-gradient(135deg, #89BCE2, #5A9AC8)' }}>
            {nickname?.[0] || email?.[0]?.toUpperCase() || 'L'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-800">{nickname || '닉네임 미설정'}</p>
            <p className="text-xs text-gray-400 mt-0.5 truncate">{email}</p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-lg font-semibold" style={{ color: '#89BCE2' }}>{diagnosisCount}</p>
            <p className="text-xs text-gray-400">총 진단</p>
          </div>
        </div>

        {/* 프로필 수정 */}
        <div className="glass-card rounded-2xl p-5 flex flex-col gap-4">
          <p className="text-sm font-semibold text-gray-700">프로필 수정</p>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-gray-400 font-medium px-1">닉네임</label>
            <input
              type="text"
              value={nickname}
              onChange={e => setNickname(e.target.value.slice(0, 12))}
              placeholder="닉네임을 입력해주세요"
              className="input-field"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs text-gray-400 font-medium px-1">피부 타입</label>
            <div className="grid grid-cols-4 gap-2">
              {SKIN_TYPES.map(type => (
                <button key={type} onClick={() => setSkinType(type)}
                  className={`select-btn text-xs py-2 ${skinType === type ? 'selected' : ''}`}
                  style={{ height: 36 }}>
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs text-gray-400 font-medium px-1">피부 고민</label>
            <div className="grid grid-cols-4 gap-2">
              {CONCERNS.map(concern => (
                <button key={concern} onClick={() => toggleConcern(concern)}
                  className={`select-btn text-xs py-2 ${skinConcerns.includes(concern) ? 'selected' : ''}`}
                  style={{ height: 36 }}>
                  {concern}
                </button>
              ))}
            </div>
          </div>

          <button onClick={handleSave} disabled={saving} className="btn-primary" style={{ marginTop: 4 }}>
            {saving ? '저장 중...' : '저장하기'}
          </button>
        </div>

        {/* 계정 설정 */}
        <div className="glass-card rounded-2xl overflow-hidden">
          <p className="text-sm font-semibold text-gray-700 px-5 pt-5 pb-3">계정</p>

          <button onClick={handleLogout}
            className="w-full flex items-center justify-between px-5 py-3.5 border-t transition-colors"
            style={{ borderColor: 'rgba(255,255,255,0.3)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(234,243,250,0.4)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
            <span className="text-sm text-gray-600">로그아웃</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#B5D5EE" strokeWidth="2" strokeLinecap="round">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </button>

          <button onClick={() => setShowDeleteConfirm(true)}
            className="w-full flex items-center justify-between px-5 py-3.5 border-t transition-colors"
            style={{ borderColor: 'rgba(255,255,255,0.3)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,240,243,0.4)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
            <span className="text-sm text-red-400">회원탈퇴</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F09090" strokeWidth="2" strokeLinecap="round">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </button>
        </div>

        <p className="text-center text-xs text-gray-300 pb-4">Lumiq v1.0</p>
      </Layout>
    </div>
  )
}
