import React from 'react';

// Base Skeleton Block
export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-slate-200/20 rounded-md ${className}`} />
  );
}

// Table Skeleton (for Admin Pages)
export function TableSkeleton({ columns = 5, rows = 5 }: { columns?: number, rows?: number }) {
  return (
    <div className="overflow-x-auto w-full">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-white/5">
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i} className="px-6 py-4">
                <Skeleton className="h-4 w-24" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <tr key={i} className="border-t border-white/5">
              {Array.from({ length: columns }).map((_, j) => (
                <td key={j} className="px-6 py-4">
                  <Skeleton className="h-4 w-full" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Table Body Skeleton (for inserting inside an existing tbody)
export function TableBodySkeleton({ columns = 5, rows = 5 }: { columns?: number, rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i} className="border-t border-white/5 animate-pulse">
          {Array.from({ length: columns }).map((_, j) => (
            <td key={j} className="px-6 py-4">
              <Skeleton className="h-4 w-full" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

// Product Grid Skeleton (for Customer Store)
export function CardGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[400px]">
          <Skeleton className="h-48 w-full rounded-none" />
          <div className="p-5 flex flex-col flex-grow">
            <Skeleton className="h-4 w-24 mb-3" />
            <Skeleton className="h-6 w-full mb-2" />
            <Skeleton className="h-6 w-2/3 mb-4" />
            <div className="mt-auto space-y-3">
              <Skeleton className="h-4 w-full" />
              <div className="flex justify-between items-center mt-4">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-10 w-24 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Product Detail Skeleton
export function DetailSkeleton() {
  return (
    <div className="bg-slate-50 min-h-screen pt-8 pb-20">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-8">
          <div className="flex flex-col lg:flex-row">
            {/* Image Gallery Skeleton */}
            <div className="w-full lg:w-[600px] flex-shrink-0 bg-slate-50 p-6 lg:p-12 flex flex-col items-center">
              <Skeleton className="w-full max-w-[400px] aspect-square mb-6" />
              <div className="flex gap-4">
                <Skeleton className="w-20 h-20" />
                <Skeleton className="w-20 h-20" />
                <Skeleton className="w-20 h-20" />
              </div>
            </div>
            {/* Info Skeleton */}
            <div className="flex-1 p-6 lg:p-12">
              <Skeleton className="h-4 w-32 mb-4" />
              <Skeleton className="h-10 w-3/4 mb-4" />
              <div className="flex gap-4 mb-6">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-6 w-24" />
              </div>
              <Skeleton className="h-12 w-48 mb-8" />
              
              <div className="space-y-4 mb-8">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-4/6" />
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <Skeleton className="h-16 w-full rounded-xl" />
                <Skeleton className="h-16 w-full rounded-xl" />
                <Skeleton className="h-16 w-full rounded-xl" />
                <Skeleton className="h-16 w-full rounded-xl" />
              </div>

              <Skeleton className="h-14 w-full rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Form Skeleton (for Admin)
export function FormSkeleton() {
  return (
    <div className="bg-[#0d0d0e] p-8 rounded-3xl border border-white/10 shadow-2xl space-y-8 animate-pulse">
      <Skeleton className="h-48 w-full rounded-xl" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <Skeleton className="h-4 w-24 mb-2" />
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
        <div>
          <Skeleton className="h-4 w-24 mb-2" />
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
        <div>
          <Skeleton className="h-4 w-24 mb-2" />
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}

// Dashboard Skeleton
export function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Skeleton className="h-28 w-full rounded-2xl" />
        <Skeleton className="h-28 w-full rounded-2xl" />
        <Skeleton className="h-28 w-full rounded-2xl" />
        <Skeleton className="h-28 w-full rounded-2xl" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-80 w-full rounded-2xl" />
        <Skeleton className="h-80 w-full rounded-2xl" />
      </div>
    </div>
  );
}
