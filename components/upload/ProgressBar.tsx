'use client'

interface ProgressBarProps {
  value: number
}

export function ProgressBar({ value }: ProgressBarProps) {
  return (
    <div className="grid gap-2.5">
      <div className="flex justify-between items-center text-xs font-bold text-[#78726A]">
        <span>جاري التحميل والمعالجة...</span>
        <span className="tabular-nums font-black text-lg text-[#A88554]">{value.toLocaleString('en-US')}%</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#EAE8E4]">
        <div
          className="h-full bg-[#A88554] rounded-full transition-all duration-500 ease-out"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  )
}
