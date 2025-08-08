"use client"

import { Shield } from "lucide-react"

interface TrustBadgeSmallProps {
  score: number
  riskLevel?: "high" | "medium" | "low"
  onClick?: () => void
}

export default function TrustBadgeSmall({ score, riskLevel, onClick }: TrustBadgeSmallProps) {
  const getRiskLevel = (score: number): "high" | "medium" | "low" => {
    if (score >= 75) return "high"
    if (score >= 50) return "medium"
    return "low"
  }

  const currentRisk = riskLevel || getRiskLevel(score)

  const getStyles = (risk: "high" | "medium" | "low") => {
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

  const styles = getStyles(currentRisk)

  return (
    <div
      className={`absolute top-2 right-2 ${styles.bgClass} rounded-lg px-2 py-1 shadow-sm z-10 flex items-center gap-1 cursor-pointer hover:shadow-md transition-all duration-200 hover:scale-105`}
      onClick={onClick}
    >
      <Shield className={`w-3 h-3 ${styles.shieldClass}`} />
      <span className={`text-xs font-medium ${styles.textClass}`}>{score}</span>

      <style jsx>{`
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
