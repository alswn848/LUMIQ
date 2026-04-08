import { useLocation, useNavigate } from 'react-router-dom'

const tabs = [
  {
    label: '홈', path: '/',
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? '#89BCE2' : '#B5D5EE'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 12L12 3L21 12V21H15V15H9V21H3V12Z" fill={active ? '#EAF3FA' : 'none'}/>
      </svg>
    ),
  },
  {
    label: '진단', path: '/diagnosis',
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? '#89BCE2' : '#B5D5EE'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"/><path d="M21 21L16.65 16.65"/><path d="M11 8V14M8 11H14"/>
      </svg>
    ),
  },
  {
    label: '루틴', path: '/routine',
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? '#89BCE2' : '#B5D5EE'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 11L12 14L22 4"/><path d="M21 12V19A2 2 0 0119 21H5A2 2 0 013 19V5A2 2 0 015 3H16"/>
      </svg>
    ),
  },
  {
    label: '히스토리', path: '/history',
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? '#89BCE2' : '#B5D5EE'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 8V12L15 15"/><circle cx="12" cy="12" r="9"/>
      </svg>
    ),
  },
]

export default function TabBar() {
  const location = useLocation()
  const navigate = useNavigate()

  const hideOn = ['/login', '/result', '/onboarding', '/auth/callback', '/my']
  if (hideOn.includes(location.pathname)) return null

  return (
    <nav className="fixed bottom-0 left-0 w-full glass-tab">
      <div className="w-full max-w-screen-xl mx-auto px-5 md:px-10 lg:px-20 flex">
        {tabs.map((tab) => {
          const active = location.pathname === tab.path
          return (
            <button key={tab.path} onClick={() => navigate(tab.path)}
              className="flex-1 flex flex-col items-center justify-center py-3 gap-1">
              {tab.icon(active)}
              <span className="text-[10px] font-medium"
                style={{ color: active ? '#89BCE2' : '#B5D5EE', fontFamily: 'Outfit, sans-serif', transition: 'color 0.2s' }}>
                {tab.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
