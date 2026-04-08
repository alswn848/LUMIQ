import { useLocation } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'

interface PageTransitionProps {
  children: React.ReactNode
}

export default function PageTransition({ children }: PageTransitionProps) {
  const location = useLocation()
  const [visible, setVisible] = useState(true)
  const prevKey = useRef(location.key)

  useEffect(() => {
    if (prevKey.current !== location.key) {
      const t0 = setTimeout(() => setVisible(false), 0)
      const t = setTimeout(() => {
        setVisible(true)
        prevKey.current = location.key
      }, 80)
      return () => { clearTimeout(t0); clearTimeout(t) }
    }
  }, [location.key])

  return (
    <div
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(6px)',
        transition: 'opacity 0.25s ease, transform 0.25s ease',
      }}
    >
      {children}
    </div>
  )
}