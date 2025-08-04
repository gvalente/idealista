"use client"

import { Shield } from "lucide-react"

interface TrustShieldInlineProps {
  score: number
  riskLevel: "high" | "medium" | "low"
  onClick?: () => void
}

export default function TrustShieldInline({ score, riskLevel, onClick }: TrustShieldInlineProps) {
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
    <div
      className="flex items-center gap-2 py-2 px-3 bg-cream rounded-lg border border-charcoal/10 cursor-pointer hover:shadow-sm transition-all duration-200 hover:scale-[1.01] textured-background"
      onClick={onClick}
    >
      <Shield className={`w-4 h-4 ${styles.colorClass}`} />
      <span className="text-sm font-medium text-charcoal font-rounded">{score}/100</span>
      <span className="text-xs text-charcoal/70 font-rounded">{styles.message}</span>

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
        .textured-background {
          background-image: 
            radial-gradient(circle at 1px 1px, rgba(74,74,74,0.03) 1px, transparent 0);
          background-size: 20px 20px;
        }
      `}</style>
    </div>
  )
}
