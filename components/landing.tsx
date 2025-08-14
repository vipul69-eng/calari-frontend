import type React from "react"

/* ————— Subcomponents ————— */

export function TrustPill({ label, icon }: { label: string; icon: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs font-medium shadow-sm dark:border-neutral-700 dark:bg-neutral-900">
      {icon}
      {label}
    </div>
  )
}

export function FeatureCard({
  iconSlot,
  title,
  desc,
  extra,

}: {
  iconSlot: React.ReactNode
  title: React.ReactNode
  desc: React.ReactNode
  extra?: React.ReactNode
  delay?: number
}) {
  return (
    <div className="rounded-3xl border border-neutral-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900/60">
      <div className="flex gap-3">
        {iconSlot}
        <div>
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">{desc}</p>
        </div>
      </div>
      {extra}
    </div>
  )
}

export function StepCard({ step, title, desc }: { step: string; title: string; desc: string }) {
  return (
    <div className="rounded-3xl border border-neutral-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900/60">
      <div className="flex flex-col gap-2">
        <div className="text-4xl font-extrabold text-emerald-600">{step}</div>
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">{desc}</p>
      </div>
    </div>
  )
}

export function MiniTrackerPreview() {
  return (
    <div className="mt-4">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">Today</div>
        <div className="text-sm text-neutral-500">1200 kcal</div>
      </div>
      <div className="mt-2 h-2 w-full rounded-full bg-neutral-200 dark:bg-neutral-700">
        <div className="h-2 rounded-full bg-emerald-500" style={{ width: "60%" }} />
      </div>
    </div>
  )
}
