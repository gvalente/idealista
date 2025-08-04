"use client"

import { useState, useEffect } from "react"

interface TrustShieldCollapsedProductionProps {
  score: number
  riskLevel: "high" | "medium" | "low"
  onClick?: () => void
  cachedScore?: number
  cachedRiskLevel?: "high" | "medium" | "low"
  className?: string
  isMobile?: boolean
}

// Consistent hand-drawn shield icon
const HandDrawnShield = ({ className, size = 40 }: { className?: string; size?: number }) => (
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

export default function TrustShieldCollapsedProduction({
  score,
  riskLevel,
  onClick,
  cachedScore,
  cachedRiskLevel,
  className = "",
  isMobile = false,
}: TrustShieldCollapsedProductionProps) {
  const [currentScore, setCurrentScore] = useState(cachedScore || 0)
  const [currentRiskLevel, setCurrentRiskLevel] = useState<"high" | "medium" | "low">(cachedRiskLevel || "high")
  const [isLoading, setIsLoading] = useState(!cachedScore)
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    if (cachedScore) {
      // If we have cached data, show it immediately
      setCurrentScore(cachedScore)
      setCurrentRiskLevel(cachedRiskLevel || "high")
      setIsLoading(false)

      // Simulate background recalculation
      const timer = setTimeout(() => {
        if (score !== cachedScore || riskLevel !== cachedRiskLevel) {
          // Score changed, show update animation
          setIsUpdating(true)
          setTimeout(() => {
            setCurrentScore(score)
            setCurrentRiskLevel(riskLevel)
            setIsUpdating(false)
          }, 300)
        }
      }, 1500) // Simulate background calculation time

      return () => clearTimeout(timer)
    } else {
      // No cached data, show loading state
      const timer = setTimeout(() => {
        setCurrentScore(score)
        setCurrentRiskLevel(riskLevel)
        setIsLoading(false)
      }, 800)

      return () => clearTimeout(timer)
    }
  }, [score, riskLevel, cachedScore, cachedRiskLevel])

  const getStyles = (risk: "high" | "medium" | "low", loading: boolean) => {
    if (loading) {
      return {
        colorClass: "text-gray-400",
        bgClass: "bg-gray-100",
        borderClass: "border-gray-200",
      }
    }

    switch (risk) {
      case "high":
        return {
          colorClass: "text-sage-600",
          bgClass: "bg-sage-50",
          borderClass: "border-sage-200",
        }
      case "medium":
        return {
          colorClass: "text-ochre-600",
          bgClass: "bg-ochre-50",
          borderClass: "border-ochre-200",
        }
      case "low":
        return {
          colorClass: "text-terracotta-600",
          bgClass: "bg-terracotta-50",
          borderClass: "border-terracotta-200",
        }
    }
  }

  const styles = getStyles(currentRiskLevel, isLoading)
  const shieldSize = isMobile ? 32 : 40

  return (
    <button
      className={`${styles.bgClass} ${styles.borderClass} rounded-xl p-4 border cursor-pointer hover:shadow-md transition-all duration-200 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
        isLoading ? "animate-pulse" : ""
      } ${isUpdating ? "animate-update" : ""} ${className}`}
      onClick={onClick}
      aria-label={`Trust Shield score: ${isLoading ? "Loading" : `${currentScore} out of 100`}. Click to view details.`}
      tabIndex={0}
    >
      <div className="modal-background">
        <div className="flex items-center gap-4">
          <div className="relative">
            <HandDrawnShield
              className={`${styles.colorClass} hand-drawn-shield transition-colors duration-500`}
              size={shieldSize}
            />
          </div>
          <div>
            <div className="text-xs text-charcoal/70 font-rounded mb-1">Trust & Quality Score</div>
            {isLoading ? (
              <div className="w-16 h-6 bg-charcoal/20 rounded animate-pulse" />
            ) : (
              <div
                className={`${isMobile ? "text-xl" : "text-2xl"} font-bold ${styles.colorClass} font-rounded transition-all duration-500`}
              >
                {currentScore}/100
              </div>
            )}
          </div>
          <div className="ml-auto text-charcoal/40">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path
                d="M6 4l4 4-4 4"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      </div>

      <style jsx>{`
        .bg-sage-50 {
          background-color: #f0f4f1;
        }
        .bg-ochre-50 {
          background-color: #faf6f0;
        }
        .bg-terracotta-50 {
          background-color: #f9f3f1;
        }
        .border-sage-200 {
          border-color: #c1d4c6;
        }
        .border-ochre-200 {
          border-color: #e8d5b7;
        }
        .border-terracotta-200 {
          border-color: #e0c4bb;
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
        .text-charcoal {
          color: #4a4a4a;
        }
        .font-rounded {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          font-feature-settings: 'cv02', 'cv03', 'cv04', 'cv11';
        }
        .hand-drawn-shield {
          filter: drop-shadow(0 1px 2px rgba(74, 74, 74, 0.1));
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
        @keyframes update {
          0% { transform: scale(1); }
          50% { transform: scale(1.02); }
          100% { transform: scale(1); }
        }
        .animate-update {
          animation: update 600ms ease-in-out;
        }
      `}</style>
    </button>
  )
}
