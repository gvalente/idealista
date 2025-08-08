"use client"

import { Shield } from "lucide-react"
import { Button } from "@/components/ui/button"

interface TrustShieldExpandedProps {
  score: number
  riskLevel: "high" | "medium" | "low"
}

// Custom hand-drawn style icons
const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" className="text-sage-600">
    <path
      d="M3 8.5L6.5 12L13 4.5"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ strokeDasharray: "0.5 1", strokeDashoffset: "0.2" }}
    />
  </svg>
)

const WarningIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" className="text-ochre-600">
    <path
      d="M8 2L14 13H2L8 2Z"
      stroke="currentColor"
      strokeWidth="1.5"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M8 6V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="8" cy="11.5" r="0.5" fill="currentColor" />
  </svg>
)

const XIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" className="text-terracotta-600">
    <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export default function TrustShieldExpanded({ score, riskLevel }: TrustShieldExpandedProps) {
  const getScoreData = (level: "high" | "medium" | "low") => {
    const data = {
      high: {
        score: score || 85,
        title: "Trust Shield",
        colorClass: "text-sage-700",
        bgClass: "bg-sage-50",
        analysis: [
          { key: "scam", label: "Scam Keywords", status: "pass" as const, message: "No concerning language" },
          { key: "price", label: "Price Check", status: "pass" as const, message: "Fair market price" },
          { key: "quality", label: "Listing Quality", status: "pass" as const, message: "High-quality photos" },
          { key: "freshness", label: "Freshness", status: "pass" as const, message: "Recently updated" },
          { key: "duplicate", label: "Duplicates", status: "pass" as const, message: "No copies found" },
          { key: "advertiser", label: "Advertiser", status: "caution" as const, message: "Generic contact" },
        ],
      },
      medium: {
        score: score || 62,
        title: "Trust Shield",
        colorClass: "text-ochre-700",
        bgClass: "bg-ochre-50",
        analysis: [
          { key: "scam", label: "Scam Keywords", status: "pass" as const, message: "No concerning language" },
          { key: "price", label: "Price Check", status: "caution" as const, message: "Slightly above average" },
          { key: "quality", label: "Listing Quality", status: "caution" as const, message: "Limited details" },
          { key: "freshness", label: "Freshness", status: "caution" as const, message: "Updated weeks ago" },
          { key: "duplicate", label: "Duplicates", status: "pass" as const, message: "No copies found" },
          { key: "advertiser", label: "Advertiser", status: "caution" as const, message: "Generic contact" },
        ],
      },
      low: {
        score: score || 28,
        title: "Trust Shield",
        colorClass: "text-terracotta-700",
        bgClass: "bg-terracotta-50",
        analysis: [
          { key: "scam", label: "Scam Keywords", status: "fail" as const, message: "Suspicious phrases" },
          { key: "price", label: "Price Check", status: "fail" as const, message: "Unusually low price" },
          { key: "quality", label: "Listing Quality", status: "fail" as const, message: "Poor quality photos" },
          { key: "freshness", label: "Freshness", status: "caution" as const, message: "Old listing" },
          { key: "duplicate", label: "Duplicates", status: "fail" as const, message: "Multiple copies" },
          { key: "advertiser", label: "Advertiser", status: "fail" as const, message: "Unverified contact" },
        ],
      },
    }
    return data[level]
  }

  const currentData = getScoreData(riskLevel)

  const getStatusIcon = (status: "pass" | "caution" | "fail") => {
    switch (status) {
      case "pass":
        return <CheckIcon />
      case "caution":
        return <WarningIcon />
      case "fail":
        return <XIcon />
    }
  }

  return (
    <div className={`${currentData.bgClass} rounded-xl p-6 border border-charcoal/10`}>
      {/* Header with hand-drawn shield */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative">
          <Shield className={`w-8 h-8 ${currentData.colorClass} hand-drawn-shield`} />
        </div>
        <div>
          <h3 className="font-medium text-charcoal text-lg font-rounded">{currentData.title}</h3>
          <div className={`text-2xl font-bold ${currentData.colorClass} font-rounded`}>{currentData.score}/100</div>
        </div>
      </div>

      {/* Analysis items with hand-drawn feel */}
      <div className="space-y-4 mb-6">
        <h4 className="font-medium text-charcoal text-sm font-rounded mb-3">Analysis Summary</h4>
        <div className="space-y-3">
          {currentData.analysis.map((item, index) => (
            <div key={item.key} className="flex items-start gap-3 p-3 bg-cream/50 rounded-lg border border-charcoal/5">
              <div className="flex-shrink-0 mt-0.5">{getStatusIcon(item.status)}</div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-charcoal text-sm font-rounded">{item.label}</div>
                <div className="text-charcoal/70 text-xs font-rounded mt-1">{item.message}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action buttons for high risk */}
      {riskLevel === "low" && (
        <div className="space-y-2 pt-4 border-t border-charcoal/10">
          <Button className="w-full bg-terracotta-600 hover:bg-terracotta-700 text-white font-rounded" size="sm">
            Report this Listing
          </Button>
          <Button
            variant="outline"
            className="w-full border-terracotta-200 text-terracotta-700 hover:bg-terracotta-50 bg-transparent font-rounded"
            size="sm"
          >
            Safety Tips
          </Button>
        </div>
      )}

      {/* Footer */}
      <div className="pt-4 border-t border-charcoal/10 mt-4">
        <Button
          variant="ghost"
          size="sm"
          className="text-xs text-charcoal/60 hover:text-charcoal p-0 h-auto font-rounded"
        >
          How is this calculated?
        </Button>
      </div>

      <style jsx>{`
        .bg-cream {
          background-color: #faf8f3;
        }
        .bg-sage-50 {
          background-color: #f0f4f1;
        }
        .bg-ochre-50 {
          background-color: #faf6f0;
        }
        .bg-terracotta-50 {
          background-color: #f9f3f1;
        }
        .text-charcoal {
          color: #4a4a4a;
        }
        .text-sage-600 {
          color: #7c9885;
        }
        .text-sage-700 {
          color: #6b8470;
        }
        .text-ochre-600 {
          color: #d4a574;
        }
        .text-ochre-700 {
          color: #c19660;
        }
        .text-terracotta-600 {
          color: #c17b6b;
        }
        .text-terracotta-700 {
          color: #b06b5a;
        }
        .bg-terracotta-600 {
          background-color: #c17b6b;
        }
        .bg-terracotta-700 {
          background-color: #b06b5a;
        }
        .border-charcoal\\/10 {
          border-color: rgba(74, 74, 74, 0.1);
        }
        .border-charcoal\\/5 {
          border-color: rgba(74, 74, 74, 0.05);
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
