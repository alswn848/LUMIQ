import type { ReactNode } from 'react'

interface LayoutProps {
  children: ReactNode
  className?: string
}

export default function Layout({ children, className = '' }: LayoutProps) {
  return (
    <div className={`w-full max-w-screen-xl mx-auto px-5 md:px-10 lg:px-20 ${className}`}>
      {children}
    </div>
  )
}