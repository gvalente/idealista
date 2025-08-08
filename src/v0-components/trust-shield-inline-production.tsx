"use client"

interface TrustShieldInlineProductionProps {
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

export default function TrustShieldInlineProduction({
  score,
  riskLevel,
  onClick,
  className = "",
}: TrustShieldInlineProductionProps) {
  const getStyles = (risk: "high" | "medium" | "low") => {
    switch (risk) {
      case "high":
        return {
          colorClass: "text-sage-600",
          message: "This listing has a high trust score",
        }
      case "medium":
        return {
          colorClass: "text-ochre-600",
          message: "This listing has a moderate trust score",
        }
      case "low":
        return {
          colorClass: "text-terracotta-600",
          message: "This listing has a low trust score",
        }
    }
  }

  const styles = getStyles(riskLevel)

  return (
    <button
      className={`flex items-center gap-2 py-2 px-3 bg-cream rounded-lg border border-charcoal/10 cursor-pointer hover:shadow-sm transition-all duration-200 hover:scale-[1.01] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 w-full ${className}`}
      onClick={onClick}
      aria-label={`${styles.message}. Score: ${score} out of 100. Click to view details.`}
      tabIndex={0}
    >
      <div className="modal-background">
        <div className="flex items-center gap-2 w-full">
          <HandDrawnShield className={`${styles.colorClass}`} size={16} />
          <span className="text-sm font-medium text-charcoal font-rounded">{score}/100</span>
          <span className="text-xs text-charcoal/70 font-rounded flex-1 text-left">{styles.message}</span>
        </div>
      </div>

      <style jsx>{`
        .bg-cream {
          background-color: #faf8f3;
        }
        .text-charcoal {
          color: #4a4a4a;
        }
        .text-sage-600 {
          color: #7c9885;
        }
        .text-ochre-600 {
          color: #d4a574;
        }
        .text-terracotta-600 {
          color: #c17b6b;
        }
        .border-charcoal\\/10 {
          border-color: rgba(74, 74, 74, 0.1);
        }
        .font-rounded {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          font-feature-settings: 'cv02', 'cv03', 'cv04', 'cv11';
        }
        .modal-background {
          position: relative;
        }
        .modal-background::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: -1;
          background-image: none; /* Ready for texture overlay */
          pointer-events: none;
        }
      `}</style>
    </button>
  )
}
