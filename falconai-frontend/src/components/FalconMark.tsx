export function FalconMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" aria-hidden="true">
      <path
        d="M8 30c6-2 11-8 14-16 1 6 4 11 10 14-5 1-9 4-11 9-2-5-7-8-13-7z"
        fill="currentColor"
      />
      <path
        d="M24 14c3-5 8-8 14-9-4 4-6 9-6 15-3-2-6-4-8-6z"
        fill="currentColor"
        opacity="0.55"
      />
    </svg>
  )
}
