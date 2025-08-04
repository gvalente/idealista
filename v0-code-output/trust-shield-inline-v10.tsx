"use client"

interface TrustShieldInlineV10Props {
  score: number
  riskLevel: "high" | "medium" | "low"
  onClick?: () => void
  className?: string
}

// Consistent hand-drawn shield icon
const HandDrawnShield = ({ className, size = 16 }: { className?: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
    <path
      d="M12 2L3 7V12C3 16.55 6.84 20.74 12 22C17.16 20.74 21 16.55 21 12V7L12 2Z"
      stroke="currentColor"
      strokeWidth="1.5"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{
        strokeDasharray: "0.3 0.7",
        strokeDashoffset: "0.1",
      }}
    />
  </svg>
)

export default function TrustShieldInlineV10({ score, riskLevel, onClick, className = "" }: TrustShieldInlineV10Props) {
  const getStyles = (risk: "high" | "medium" | "low") => {
    switch (risk) {
      case "high":
        return {
          colorClass: "trust-shield-text-sage-600",
          message: "This listing has a high trust score",
        }
      case "medium":
        return {
          colorClass: "trust-shield-text-ochre-600",
          message: "This listing has a moderate trust score",
        }
      case "low":
        return {
          colorClass: "trust-shield-text-terracotta-600",
          message: "This listing has a low trust score",
        }
    }
  }

  const styles = getStyles(riskLevel)

  return (
    <button
      className={`trust-shield-flex trust-shield-items-center trust-shield-gap-2 trust-shield-py-2 trust-shield-px-3 trust-shield-bg-cream trust-shield-rounded-lg trust-shield-border trust-shield-border-charcoal-10 trust-shield-cursor-pointer hover:trust-shield-shadow-sm trust-shield-transition-all trust-shield-duration-200 hover:trust-shield-scale-101 focus:trust-shield-outline-none focus:trust-shield-ring-2 focus:trust-shield-ring-blue-500 focus:trust-shield-ring-offset-2 trust-shield-w-full ${className}`}
      onClick={onClick}
      aria-label={`${styles.message}. Score: ${score} out of 100. Click to view details.`}
      tabIndex={0}
    >
      <div className="trust-shield-modal-background">
        <div className="trust-shield-flex trust-shield-items-center trust-shield-gap-2 trust-shield-w-full">
          <HandDrawnShield className={`${styles.colorClass}`} size={16} />
          <span className="trust-shield-text-sm trust-shield-font-medium trust-shield-text-charcoal trust-shield-font-rounded">
            {score}/100
          </span>
          <span className="trust-shield-text-xs trust-shield-text-charcoal-50 trust-shield-font-rounded trust-shield-flex-1 trust-shield-text-left">
            {styles.message}
          </span>
        </div>
      </div>
    </button>
  )
}
