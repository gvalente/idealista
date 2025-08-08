"use client"

import { useState, useEffect } from "react"
import { Shield } from "lucide-react"

interface TrustShieldCollapsedCachedProps {
  score: number
  riskLevel: "high" | "medium" | "low"
  onClick?: () => void
  cachedScore?: number
  cachedRiskLevel?: "high" | "medium" | "low"
}

export default function TrustShieldCollapsedCached({
  score,
  riskLevel,
  onClick,
  cachedScore,
  cachedRiskLevel,
}: TrustShieldCollapsedCachedProps) {
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

  return (
    <div
      className={`${styles.bgClass} ${styles.borderClass} rounded-xl p-4 border cursor-pointer hover:shadow-md transition-all duration-200 hover:scale-[1.02] ${
        isLoading ? "animate-pulse" : ""
      } ${isUpdating ? "animate-update" : ""}`}
      onClick={onClick}
    >
      <div className="flex items-center gap-4">
        <div className="relative">
          <Shield className={`w-10 h-10 ${styles.colorClass} hand-drawn-shield transition-colors duration-500`} />
        </div>
        <div>
          <div className="text-xs text-charcoal/70 font-rounded mb-1">Trust & Quality Score</div>
          {isLoading ? (
            <div className="w-16 h-6 bg-charcoal/20 rounded animate-pulse" />
          ) : (
            <div className={`text-2xl font-bold ${styles.colorClass} font-rounded transition-all duration-500`}>
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
        @keyframes update {
          0% { transform: scale(1); }
          50% { transform: scale(1.02); }
          100% { transform: scale(1); }
        }
        .animate-update {
          animation: update 600ms ease-in-out;
        }
      `}</style>
    </div>
  )
}
