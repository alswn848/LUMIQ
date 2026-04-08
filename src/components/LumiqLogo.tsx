interface LumiqLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg'
  showText?: boolean
}

export default function LumiqLogo({ size = 'md', showText = true }: LumiqLogoProps) {
  const sizes = {
    xs: { img: 16, text: 'text-xs' },
    sm: { img: 44, text: 'text-base' },
    md: { img: 48, text: 'text-xl' },
    lg: { img: 80, text: 'text-3xl' },
  }
  const s = sizes[size]
  const isSmall = size === 'xs' || size === 'sm'

  return (
    <div className={`flex ${isSmall ? 'flex-row items-center gap-1.5' : 'flex-col items-center gap-2'}`}>
      <img
        src="/logo.png"
        alt="Lumiq 로고"
        style={{
          width: s.img,
          height: s.img,
          objectFit: 'contain',
          mixBlendMode: 'multiply',
        }}
      />
      {showText && (
        <span
          className={`${s.text} font-semibold text-gray-700`}
          style={{ letterSpacing: isSmall ? '0.12em' : '0.18em', fontFamily: 'Outfit, sans-serif', marginTop: isSmall ? '3px' : 0 }}
        >
          LUMIQ
        </span>
      )}
    </div>
  )
}