import { useEffect, useRef, useState } from 'react'

interface Props {
  visible: boolean
  onHidden?: () => void
}

export default function AnalyzingScreen({ visible, onHidden }: Props) {
  const [mounted, setMounted] = useState(false)
  const [animateIn, setAnimateIn] = useState(false)
  const onHiddenRef = useRef(onHidden)

  useEffect(() => { onHiddenRef.current = onHidden })

  useEffect(() => {
    if (visible) {
      setMounted(true)
      // double rAF: DOM에 opacity:0 상태로 mount된 뒤 transition 시작
      const id = requestAnimationFrame(() =>
        requestAnimationFrame(() => setAnimateIn(true))
      )
      return () => cancelAnimationFrame(id)
    } else if (mounted) {
      setAnimateIn(false)
    }
  }, [visible]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleTransitionEnd = (e: React.TransitionEvent) => {
    if (e.propertyName === 'opacity' && !animateIn) {
      setMounted(false)
      onHiddenRef.current?.()
    }
  }

  if (!mounted) return null

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden"
      style={{
        background: '#ffffff',
        opacity: animateIn ? 1 : 0,
        transition: 'opacity 0.5s ease-in-out',
        pointerEvents: animateIn ? 'auto' : 'none',
      }}
      onTransitionEnd={handleTransitionEnd}
    >
      {/* 부유 버블 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute analyzing-bubble-1"
          style={{
            width: 220,
            height: 220,
            background: '#7BB898',
            opacity: 0.28,
            filter: 'blur(45px)',
            top: '12%',
            left: '8%',
          }}
        />
        <div
          className="absolute analyzing-bubble-2"
          style={{
            width: 170,
            height: 170,
            background: '#3D8B60',
            opacity: 0.22,
            filter: 'blur(38px)',
            bottom: '18%',
            right: '10%',
          }}
        />
        <div
          className="absolute analyzing-bubble-3"
          style={{
            width: 135,
            height: 135,
            background: '#7BB898',
            opacity: 0.19,
            filter: 'blur(32px)',
            top: '38%',
            right: '7%',
          }}
        />
      </div>

      {/* 로고 + 텍스트 */}
      <div className="relative z-10 flex flex-col items-center gap-9">
        <img
          src="/logo.png"
          alt="Lumiq"
          style={{ width: 80, height: 80, objectFit: 'contain' }}
        />

        <span className="flex items-center gap-1.5">
          <span className="analyzing-dot" style={{ animationDelay: '0s' }} />
          <span className="analyzing-dot" style={{ animationDelay: '0.22s' }} />
          <span className="analyzing-dot" style={{ animationDelay: '0.44s' }} />
        </span>

        <div className="flex flex-col items-center gap-2">
          <span
            className="text-base font-medium"
            style={{ color: '#1A2E24', fontFamily: 'Outfit, Noto Sans KR, sans-serif' }}
          >
            AI가 피부를 분석하고 있어요
          </span>
          <p
            className="text-sm"
            style={{ color: '#7BB898', fontFamily: 'Outfit, Noto Sans KR, sans-serif' }}
          >
            보통 10~20초 정도 걸려요
          </p>
        </div>
      </div>
    </div>
  )
}
