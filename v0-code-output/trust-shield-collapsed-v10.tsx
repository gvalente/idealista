"use client"

import { useState, useEffect } from "react"

interface TrustShieldCollapsedV10Props {
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

export default function TrustShieldCollapsedV10({
  score,
  riskLevel,
  onClick,
  cachedScore,
  cachedRiskLevel,
  className = "",
  isMobile = false,
}: TrustShieldCollapsedV10Props) {
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
        colorClass: "trust-shield-text-gray-400",
        bgClass: "trust-shield-bg-gray-100",
        borderClass: "trust-shield-border-gray-200",
      }
    }

    switch (risk) {
      case "high":
        return {
          colorClass: "trust-shield-text-sage-600",
          bgClass: "trust-shield-bg-sage-50",
          borderClass: "trust-shield-border-sage-200",
        }
      case "medium":
        return {
          colorClass: "trust-shield-text-ochre-600",
          bgClass: "trust-shield-bg-ochre-50",
          borderClass: "trust-shield-border-ochre-200",
        }
      case "low":
        return {
          colorClass: "trust-shield-text-terracotta-600",
          bgClass: "trust-shield-bg-terracotta-50",
          borderClass: "trust-shield-border-terracotta-200",
        }
    }
  }

  const styles = getStyles(currentRiskLevel, isLoading)
  const shieldSize = isMobile ? 32 : 40

  return (
    <button
      className={`${styles.bgClass} ${styles.borderClass} trust-shield-rounded-xl trust-shield-p-4 trust-shield-border trust-shield-cursor-pointer hover:trust-shield-shadow-md trust-shield-transition-all trust-shield-duration-200 hover:trust-shield-scale-102 focus:trust-shield-outline-none focus:trust-shield-ring-2 focus:trust-shield-ring-blue-500 focus:trust-shield-ring-offset-2 ${
        isLoading ? "trust-shield-animate-pulse" : ""
      } ${isUpdating ? "trust-shield-animate-update" : ""} ${className}`}
      onClick={onClick}
      aria-label={`Trust Shield score: ${isLoading ? "Loading" : `${currentScore} out of 100`}. Click to view details.`}
      tabIndex={0}
    >
      <div className="trust-shield-modal-background">
        <div className="trust-shield-flex trust-shield-items-center trust-shield-gap-4">
          <div className="trust-shield-relative">
            <HandDrawnShield
              className={`${styles.colorClass} trust-shield-hand-drawn-shield trust-shield-transition-colors trust-shield-duration-500`}
              size={shieldSize}
            />
          </div>
          <div>
            <div className="trust-shield-text-xs trust-shield-text-charcoal-70 trust-shield-font-rounded trust-shield-mb-1">
              Trust & Quality Score
            </div>
            {isLoading ? (
              <div className="trust-shield-w-16 trust-shield-h-6 trust-shield-bg-charcoal-20 trust-shield-rounded trust-shield-animate-pulse" />
            ) : (
              <div
                className={`${isMobile ? "trust-shield-text-xl" : "trust-shield-text-2xl"} trust-shield-font-bold ${styles.colorClass} trust-shield-font-rounded trust-shield-transition-all trust-shield-duration-500`}
              >
                {currentScore}/100
              </div>
            )}
          </div>
          <div className="trust-shield-ml-auto trust-shield-text-charcoal-40">
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
    </button>
  )
}
