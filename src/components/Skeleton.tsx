const shimmerStyle = `
  @keyframes shimmer {
    0%   { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
`

interface SkeletonProps {
    className?: string
    style?: React.CSSProperties
  }
  
  export function Skeleton({ className = '', style }: SkeletonProps) {
    return (
      <div
        className={`rounded-xl ${className}`}
        style={{
          background: 'linear-gradient(90deg, #F0F0F5 25%, #E8E8F0 50%, #F0F0F5 75%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.5s infinite',
          ...style,
        }}
      />
    )
  }
  
  export function HomePageSkeleton() {
    return (
      <div className="flex flex-col gap-5 pt-7 px-5 md:px-10 lg:px-20">
        <style>{shimmerStyle}</style>
  
        {/* 환영 문구 */}
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-2">
            <Skeleton style={{ height: 28, width: 220 }} />
            <Skeleton style={{ height: 16, width: 160 }} />
          </div>
        </div>
  
        {/* 진단 시작 버튼 */}
        <Skeleton style={{ height: 72, borderRadius: 16 }} />
  
        {/* 주간 리포트 3개 카드 */}
        <div className="grid grid-cols-3 gap-3">
          <Skeleton style={{ height: 72, borderRadius: 16 }} />
          <Skeleton style={{ height: 72, borderRadius: 16 }} />
          <Skeleton style={{ height: 72, borderRadius: 16 }} />
        </div>
  
        {/* 오늘의 루틴 + 최근 진단 2컬럼 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* 오늘의 루틴 카드 */}
          <div className="flex flex-col gap-3 bg-white rounded-2xl p-5"
            style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>
            <div className="flex justify-between items-center">
              <Skeleton style={{ height: 16, width: 80 }} />
              <Skeleton style={{ height: 12, width: 40 }} />
            </div>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton style={{ width: 16, height: 16, borderRadius: '50%' }} />
                <Skeleton style={{ height: 14, width: 60 + i * 10 }} />
              </div>
            ))}
            <Skeleton style={{ height: 4, borderRadius: 99, marginTop: 8 }} />
          </div>
  
          {/* 최근 진단 */}
          <div className="flex flex-col gap-3">
            <Skeleton style={{ height: 16, width: 80 }} />
            {[1, 2].map((i) => (
              <div key={i} className="flex items-center gap-3 bg-white rounded-2xl p-4"
                style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                <Skeleton style={{ width: 36, height: 36, borderRadius: '50%' }} />
                <div className="flex flex-col gap-1.5 flex-1">
                  <Skeleton style={{ height: 14, width: 80 }} />
                  <Skeleton style={{ height: 12, width: 40 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

export function RoutinePageSkeleton() {
  return (
    <div className="flex flex-col gap-5 pt-6 px-5 md:px-10 lg:px-20">
      <style>{shimmerStyle}</style>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-card rounded-2xl p-5 flex flex-col gap-3">
          <div className="flex justify-between">
            <Skeleton style={{ height: 16, width: 80 }} />
            <Skeleton style={{ height: 16, width: 40 }} />
          </div>
          <Skeleton style={{ height: 8, borderRadius: 99 }} />
        </div>
        <div className="flex flex-col gap-3">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="glass-card rounded-2xl p-4 flex items-center gap-4">
              <Skeleton style={{ width: 24, height: 24, borderRadius: '50%' }} />
              <div className="flex flex-col gap-1.5 flex-1">
                <Skeleton style={{ height: 14, width: 60 }} />
                <Skeleton style={{ height: 12, width: 120 }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function MypageSkeleton() {
  return (
    <div className="flex flex-col gap-5 pt-6 px-5 md:px-10 lg:px-20">
      <style>{shimmerStyle}</style>
      <div className="glass-card rounded-2xl p-5 flex items-center gap-4">
        <Skeleton style={{ width: 48, height: 48, borderRadius: '50%' }} />
        <div className="flex flex-col gap-2 flex-1">
          <Skeleton style={{ height: 16, width: 100 }} />
          <Skeleton style={{ height: 12, width: 160 }} />
        </div>
      </div>
      <div className="glass-card rounded-2xl p-5 flex flex-col gap-4">
        <Skeleton style={{ height: 16, width: 80 }} />
        <Skeleton style={{ height: 44, borderRadius: 12 }} />
        <div className="grid grid-cols-4 gap-2">
          {[1,2,3,4,5,6,7,8].map(i => <Skeleton key={i} style={{ height: 36, borderRadius: 12 }} />)}
        </div>
      </div>
    </div>
  )
}

export function DiaryPageSkeleton() {
  return (
    <div className="flex flex-col gap-5 pt-6 px-5 md:px-10 lg:px-20">
      <style>{shimmerStyle}</style>
      <div className="glass-card rounded-2xl p-5 flex flex-col gap-4">
        <Skeleton style={{ height: 20, width: 120 }} />
        <div className="flex gap-3 justify-center">
          {[1,2,3,4,5].map(i => <Skeleton key={i} style={{ width: 44, height: 44, borderRadius: '50%' }} />)}
        </div>
        <Skeleton style={{ height: 100, borderRadius: 12 }} />
      </div>
      {[1,2,3].map(i => (
        <div key={i} className="glass-card rounded-2xl p-4 flex items-center gap-3">
          <Skeleton style={{ width: 40, height: 40, borderRadius: 10 }} />
          <div className="flex flex-col gap-1.5 flex-1">
            <Skeleton style={{ height: 14, width: 80 }} />
            <Skeleton style={{ height: 12, width: 140 }} />
          </div>
        </div>
      ))}
    </div>
  )
}