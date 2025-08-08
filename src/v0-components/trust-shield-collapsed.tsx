"use client"

import { Shield } from "lucide-react"

interface TrustShieldCollapsedProps {
  score: number
  riskLevel: "high" | "medium" | "low"
  onClick?: () => void
}

export default function TrustShieldCollapsed({ score, riskLevel, onClick }: TrustShieldCollapsedProps) {
  const getStyles = (risk: "high" | "medium" | "low") => {
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

  const styles = getStyles(riskLevel)

  return (
    <div
      className={`${styles.bgClass} ${styles.borderClass} rounded-xl p-4 border cursor-pointer hover:shadow-md transition-all duration-200 hover:scale-[1.02]`}
      onClick={onClick}
    >
      <div className="flex items-center gap-4">
        <div className="relative">
          <Shield className={`w-10 h-10 ${styles.colorClass} hand-drawn-shield`} />
        </div>
        <div>
          <div className="text-xs text-charcoal/70 font-rounded mb-1">Trust & Quality Score</div>
          <div className={`text-2xl font-bold ${styles.colorClass} font-rounded`}>{score}/100</div>
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
      `}</style>
    </div>
  )
}
