"use client"

import { useState, useEffect } from "react"
import { Shield } from "lucide-react"

interface TrustBadgeLoadingProps {
  finalScore: number
  finalRiskLevel: "high" | "medium" | "low"
  onClick?: () => void
  delay?: number
}

export default function TrustBadgeLoading({ finalScore, finalRiskLevel, onClick, delay = 0 }: TrustBadgeLoadingProps) {
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
        bgClass: "bg-gray-400",
        textClass: "text-white",
        shieldClass: "text-white",
      }
    }

    switch (risk) {
      case "high":
        return {
          bgClass: "bg-sage-600",
          textClass: "text-white",
          shieldClass: "text-white",
        }
      case "medium":
        return {
          bgClass: "bg-ochre-500",
          textClass: "text-white",
          shieldClass: "text-white",
        }
      case "low":
        return {
          bgClass: "bg-terracotta-600",
          textClass: "text-white",
          shieldClass: "text-white",
        }
    }
  }

  const styles = getStyles(riskLevel, isLoading)

  return (
    <div
      className={`absolute top-2 right-2 rounded-lg px-2 py-1 shadow-sm z-10 flex items-center gap-1 cursor-pointer hover:shadow-md transition-all duration-500 hover:scale-105 ${
        isLoading ? "animate-pulse" : ""
      }`}
      onClick={onClick}
      style={{
        backgroundColor: isLoading
          ? "#9ca3af"
          : riskLevel === "high"
            ? "#7c9885"
            : riskLevel === "medium"
              ? "#d4a574"
              : "#c17b6b",
        transition: "background-color 800ms ease-in-out",
      }}
    >
      <Shield className={`w-3 h-3 ${styles.shieldClass} transition-all duration-500`} />

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
        
        .bg-sage-600 {
          background-color: #7c9885;
        }
        .bg-ochre-500 {
          background-color: #d4a574;
        }
        .bg-terracotta-600 {
          background-color: #c17b6b;
        }
      `}</style>
    </div>
  )
}
