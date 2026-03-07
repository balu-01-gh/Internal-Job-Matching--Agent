/**
 * SkeletonLoader.jsx - Loading skeleton animation
 */

import React from 'react'

export default function SkeletonLoader({ width = 'w-full', height = 'h-4', className = '' }) {
  return (
    <div className={`
      ${width} ${height} ${className}
      bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200
      rounded-lg animate-shimmer
    `} />
  )
}

export function ProjectCardSkeleton() {
  return (
    <div className="card-gradient p-6 space-y-4 animate-pulse">
      <SkeletonLoader height="h-6" width="w-3/4" />
      <SkeletonLoader height="h-4" width="w-full" />
      <SkeletonLoader height="h-4" width="w-5/6" />
      <div className="flex gap-2 pt-4">
        <SkeletonLoader height="h-6" width="w-20" className="rounded-full" />
        <SkeletonLoader height="h-6" width="w-24" className="rounded-full" />
      </div>
    </div>
  )
}

export function TableRowSkeleton() {
  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50">
      <td className="px-6 py-4"><SkeletonLoader width="w-32" /></td>
      <td className="px-6 py-4"><SkeletonLoader width="w-48" /></td>
      <td className="px-6 py-4"><SkeletonLoader width="w-20" /></td>
      <td className="px-6 py-4"><SkeletonLoader width="w-16" className="rounded-full" /></td>
    </tr>
  )
}

export function ProfileCardSkeleton() {
  return (
    <div className="card-gradient space-y-4 animate-pulse p-4">
      <div className="flex items-center gap-4">
        <SkeletonLoader width="w-12 h-12" className="rounded-full" />
        <div className="flex-1 space-y-2">
          <SkeletonLoader height="h-4" width="w-32" />
          <SkeletonLoader height="h-3" width="w-48" />
        </div>
      </div>
      <SkeletonLoader height="h-3" width="w-full" />
      <SkeletonLoader height="h-3" width="w-5/6" />
    </div>
  )
}

export function TeamCardSkeleton() {
  return (
    <div className="card-gradient p-6 space-y-4 animate-pulse">
      <SkeletonLoader height="h-6" width="w-2/3" />
      <div className="space-y-2">
        <SkeletonLoader height="h-3" width="w-full" />
        <SkeletonLoader height="h-3" width="w-4/5" />
      </div>
      <div className="pt-4 border-t border-gray-200">
        <div className="flex gap-2 flex-wrap">
          {[1, 2, 3].map(i => (
            <SkeletonLoader key={i} height="h-8" width="w-20" className="rounded-full" />
          ))}
        </div>
      </div>
    </div>
  )
}

export function FormInputSkeleton() {
  return (
    <div className="space-y-2">
      <SkeletonLoader height="h-4" width="w-24" />
      <SkeletonLoader height="h-10" width="w-full" className="rounded-lg" />
    </div>
  )
}

export function ListItemSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 border-b border-gray-100">
      <SkeletonLoader width="w-10 h-10" className="rounded-lg" />
      <div className="flex-1 space-y-2">
        <SkeletonLoader height="h-4" width="w-2/3" />
        <SkeletonLoader height="h-3" width="w-1/2" />
      </div>
      <SkeletonLoader width="w-16 h-8" className="rounded-lg" />
    </div>
  )
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="card-gradient p-6 space-y-3">
            <SkeletonLoader height="h-4" width="w-1/2" />
            <SkeletonLoader height="h-8" width="w-3/4" />
          </div>
        ))}
      </div>
      <div className="card-gradient p-6 space-y-4">
        <SkeletonLoader height="h-6" width="w-2/5" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <SkeletonLoader key={i} height="h-12" width="w-full" className="rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  )
}

export function CommentSkeleton() {
  return (
    <div className="flex gap-4 p-4 animate-pulse">
      <SkeletonLoader width="w-10 h-10" className="rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <SkeletonLoader height="h-4" width="w-1/3" />
        <SkeletonLoader height="h-3" width="w-full" />
        <SkeletonLoader height="h-3" width="w-5/6" />
      </div>
    </div>
  )
}

export function EmployeeCardSkeleton() {
  return (
    <div className="card-gradient p-6 space-y-4 animate-pulse">
      <div className="flex items-center gap-4 pb-4 border-b border-gray-200">
        <SkeletonLoader width="w-16 h-16" className="rounded-full" />
        <div className="flex-1 space-y-2">
          <SkeletonLoader height="h-5" width="w-2/3" />
          <SkeletonLoader height="h-3" width="w-1/2" />
        </div>
      </div>
      <div className="space-y-3">
        <div>
          <SkeletonLoader height="h-3" width="w-1/4" />
          <SkeletonLoader height="h-4" width="w-3/4" className="mt-2" />
        </div>
        <div>
          <SkeletonLoader height="h-3" width="w-1/4" />
          <div className="flex gap-2 mt-2">
            {[1, 2, 3].map(i => (
              <SkeletonLoader key={i} height="h-6" width="w-20" className="rounded-full" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export function HeatmapSkeleton() {
  return (
    <div className="card-gradient p-6 space-y-4 animate-pulse">
      <SkeletonLoader height="h-6" width="w-1/3" />
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="flex gap-4 items-center">
            <SkeletonLoader height="h-4" width="w-32" />
            <div className="flex gap-2 flex-1">
              {[1, 2, 3, 4, 5].map(j => (
                <SkeletonLoader key={j} width="w-full h-8" className="rounded" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
