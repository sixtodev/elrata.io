import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-white/5',
        className
      )}
    />
  )
}

export function AlertCardSkeleton() {
  return (
    <div className="bg-[#1C1C1F] border border-[#2a2a2a] rounded-xl p-5">
      <div className="flex justify-between mb-3">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <div className="flex gap-6">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-24" />
      </div>
    </div>
  )
}

export function AlertListSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <AlertCardSkeleton key={i} />
      ))}
    </div>
  )
}
