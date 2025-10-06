import { X } from "lucide-react"
import { brandConfig } from "../constants/navigation"

interface BrandHeaderProps {
  onClose?: () => void
}

export function BrandHeader({ onClose }: BrandHeaderProps) {
  const LogoIcon = brandConfig.logo

  return (
    <div className="flex items-center justify-between px-4 h-14 border-b border-white/10">
      <div className="flex items-center gap-3">
        <div className={`inline-flex items-center justify-center w-9 h-9 rounded ${brandConfig.logoColor}`}>
          <LogoIcon className="w-5 h-5 text-white" />
        </div>
        <div className="leading-none">
          <div className="text-base font-semibold">{brandConfig.name}</div>
          <div className="text-xs text-white/70">{brandConfig.subtitle}</div>
        </div>
      </div>
      {/* Mobile close button */}
      {onClose && (
        <button
          onClick={onClose}
          className="lg:hidden p-1 hover:bg-white/10 rounded-md transition-colors"
          aria-label="Close menu"
        >
          <X className="w-5 h-5" />
        </button>
      )}
    </div>
  )
}
