"use client"

import { useState, useEffect } from "react"

interface TrustBadgeProductionProps {
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

export default function TrustBadgeProduction({
  finalScore,
  finalRiskLevel,
  onClick,
  delay = 0,
  className = "",
}: TrustBadgeProductionProps) {
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
        textClass: "text-white",
        shieldClass: "text-white",
      }
    }

    switch (risk) {
      case "high":
        return {
          bgColor: "#7c9885",
          textClass: "text-white",
          shieldClass: "text-white",
        }
      case "medium":
        return {
          bgColor: "#d4a574",
          textClass: "text-white",
          shieldClass: "text-white",
        }
      case "low":
        return {
          bgColor: "#c17b6b",
          textClass: "text-white",
          shieldClass: "text-white",
        }
    }
  }

  const styles = getStyles(riskLevel, isLoading)

  return (
    <button
      className={`absolute top-2 right-2 rounded-lg px-2 py-1 shadow-sm z-10 flex items-center gap-1 cursor-pointer hover:shadow-md transition-all duration-500 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
        isLoading ? "animate-pulse" : ""
      } ${className}`}
      onClick={onClick}
      style={{
        backgroundColor: styles.bgColor,
        transition: "background-color 800ms ease-in-out",
        height: "24px", // Fixed height to prevent layout jump
        minWidth: "44px", // Fixed minimum width
      }}
      aria-label={`Trust score: ${isLoading ? "Loading" : `${score} out of 100`}`}
      tabIndex={0}
    >
      <HandDrawnShield className={`${styles.shieldClass} transition-all duration-500`} size={12} />

      {isLoading ? (
        <div className="w-6 h-3 bg-white/30 rounded animate-pulse" />
      ) : (
        <span
          className={`text-xs font-medium ${styles.textClass} transition-opacity duration-500`}
          style={{
            animation: isLoading ? "none" : "fadeIn 600ms ease-in-out",
          }}
        >
          {score}
        </span>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(2px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </button>
  )
}
