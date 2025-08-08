"use client"

import { useState, useEffect } from "react"

interface TrustBadgeV10Props {
  finalScore: number
  finalRiskLevel: "high" | "medium" | "low"
  onClick?: () => void
  delay?: number
  className?: string
}

// Consistent hand-drawn shield icon
const HandDrawnShield = ({ className, size = 12 }: { className?: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
    <path
      d="M12 2L3 7V12C3 16.55 6.84 20.74 12 22C17.16 20.74 21 16.55 21 12V7L12 2Z"
      stroke="currentColor"
      strokeWidth="1.8"
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

export default function TrustBadgeV10({
  finalScore,
  finalRiskLevel,
  onClick,
  delay = 0,
  className = "",
}: TrustBadgeV10Props) {
  const [isLoading, setIsLoading] = useState(true)
  const [score, setScore] = useState(0)
  const [riskLevel, setRiskLevel] = useState<"high" | "medium" | "low">("high")

  useEffect(() => {
    const timer = setTimeout(() => {
      setScore(finalScore)
      setRiskLevel(finalRiskLevel)
      setIsLoading(false)
    }, delay)

    return () => clearTimeout(timer)
  }, [finalScore, finalRiskLevel, delay])

  const getStyles = (risk: "high" | "medium" | "low", loading: boolean) => {
    if (loading) {
      return {
        bgColor: "#9ca3af",
        textClass: "trust-shield-text-white",
        shieldClass: "trust-shield-text-white",
      }
    }

    switch (risk) {
      case "high":
        return {
          bgColor: "#7c9885",
          textClass: "trust-shield-text-white",
          shieldClass: "trust-shield-text-white",
        }
      case "medium":
        return {
          bgColor: "#d4a574",
          textClass: "trust-shield-text-white",
          shieldClass: "trust-shield-text-white",
        }
      case "low":
        return {
          bgColor: "#c17b6b",
          textClass: "trust-shield-text-white",
          shieldClass: "trust-shield-text-white",
        }
    }
  }

  const styles = getStyles(riskLevel, isLoading)

  return (
    <button
      className={`trust-shield-absolute trust-shield-top-2 trust-shield-right-2 trust-shield-rounded-lg trust-shield-px-2 trust-shield-py-1 trust-shield-shadow-sm trust-shield-z-10 trust-shield-flex trust-shield-items-center trust-shield-gap-1 trust-shield-cursor-pointer hover:trust-shield-shadow-md trust-shield-transition-all trust-shield-duration-500 hover:trust-shield-scale-105 focus:trust-shield-outline-none focus:trust-shield-ring-2 focus:trust-shield-ring-blue-500 focus:trust-shield-ring-offset-2 ${
        isLoading ? "trust-shield-animate-pulse" : ""
      } ${className}`}
      onClick={onClick}
      style={{
        backgroundColor: styles.bgColor,
        transition: "background-color 800ms ease-in-out",
        height: "40px", // Increased for mobile tap targets
        minWidth: "60px", // Increased for mobile tap targets
      }}
      aria-label={`Trust score: ${isLoading ? "Loading" : `${score} out of 100`}`}
      tabIndex={0}
    >
      <HandDrawnShield
        className={`${styles.shieldClass} trust-shield-transition-all trust-shield-duration-500`}
        size={14}
      />

      {isLoading ? (
        <div className="trust-shield-w-6 trust-shield-h-3 trust-shield-bg-white-30 trust-shield-rounded trust-shield-animate-pulse" />
      ) : (
        <span
          className={`trust-shield-text-sm trust-shield-font-medium ${styles.textClass} trust-shield-transition-opacity trust-shield-duration-500`}
          style={{
            animation: isLoading ? "none" : "trust-shield-fadeIn 600ms ease-in-out",
          }}
        >
          {score}
        </span>
      )}
    </button>
  )
}
