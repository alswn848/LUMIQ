import { useEffect, useState } from 'react'
import LumiqLogo from '../components/LumiqLogo'

interface SplashPageProps {
  onDone: () => void
}

export default function SplashPage({ onDone }: SplashPageProps) {
  const [phase, setPhase] = useState<'in' | 'hold' | 'out'>('in')

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('hold'), 400)
    const t2 = setTimeout(() => setPhase('out'), 1800)
    const t3 = setTimeout(() => onDone(), 2200)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [onDone])

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-white"
      style={{
        opacity: phase === 'out' ? 0 : 1,
        transition: phase === 'out' ? 'opacity 0.4s ease' : 'none',
        pointerEvents: 'none',
      }}
    >
      <div style={{
        opacity: phase === 'in' ? 0 : 1,
        transform: phase === 'in' ? 'scale(0.85)' : 'scale(1)',
        transition: 'opacity 0.5s ease, transform 0.5s ease',
      }}>
        <LumiqLogo size="lg" />
      </div>
    </div>
  )
}