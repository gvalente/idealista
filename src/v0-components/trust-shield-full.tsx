"use client"

import { useState } from "react"
import { Shield, CheckCircle, AlertTriangle, X, HelpCircle, ChevronUp, AlertCircle } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface TrustShieldFullProps {
  score?: number
  riskLevel?: "high" | "medium" | "low"
}

export default function TrustShieldFull({ score = 85, riskLevel }: TrustShieldFullProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const getRiskLevel = (score: number): "high" | "medium" | "low" => {
    if (score >= 75) return "high"
    if (score >= 50) return "medium"
    return "low"
  }

  const currentRisk = riskLevel || getRiskLevel(score)

  const getScoreData = (level: "high" | "medium" | "low") => {
    const data = {
      high: {
        score: score || 85,
        title: "Trust Shield",
        colorClass: "text-green-600",
        bgClass: "bg-green-50 border-green-200",
        badgeBgClass: "bg-green-600",
        shieldClass: "text-green-600",
        shadowClass: "shadow-green-100",
        analysis: [
          { key: "scam", label: "Scam Keyword Scan", status: "pass" as const, message: "No high-risk language found" },
          { key: "price", label: "Price Analysis", status: "pass" as const, message: "Priced appropriately for area" },
          {
            key: "quality",
            label: "Listing Quality",
            status: "pass" as const,
            message: "High-quality photos & details",
          },
          { key: "freshness", label: "Listing Freshness", status: "pass" as const, message: "Updated 3 days ago" },
          { key: "duplicate", label: "Duplicate Check", status: "pass" as const, message: "No duplicates found" },
          {
            key: "advertiser",
            label: "Advertiser Check",
            status: "caution" as const,
            message: "Agency using generic email",
          },
        ],
      },
      medium: {
        score: score || 62,
        title: "Trust Shield",
        colorClass: "text-yellow-600",
        bgClass: "bg-yellow-50 border-yellow-200",
        badgeBgClass: "bg-yellow-500",
        shieldClass: "text-yellow-600",
        shadowClass: "shadow-yellow-100",
        analysis: [
          { key: "scam", label: "Scam Keyword Scan", status: "pass" as const, message: "No high-risk language found" },
          {
            key: "price",
            label: "Price Analysis",
            status: "caution" as const,
            message: "Price slightly above average",
          },
          {
            key: "quality",
            label: "Listing Quality",
            status: "caution" as const,
            message: "Limited photos, no floor plan",
          },
          { key: "freshness", label: "Listing Freshness", status: "caution" as const, message: "Updated 24 days ago" },
          { key: "duplicate", label: "Duplicate Check", status: "pass" as const, message: "No duplicates found" },
          {
            key: "advertiser",
            label: "Advertiser Check",
            status: "caution" as const,
            message: "Agency using generic email",
          },
        ],
      },
      low: {
        score: score || 28,
        title: "Trust Shield",
        colorClass: "text-red-600",
        bgClass: "bg-red-50 border-red-200",
        badgeBgClass: "bg-red-600",
        shieldClass: "text-red-600",
        shadowClass: "shadow-red-100",
        analysis: [
          { key: "scam", label: "Scam Keyword Scan", status: "fail" as const, message: "High-risk keywords detected" },
          { key: "price", label: "Price Analysis", status: "fail" as const, message: "Price anomaly: Unusually low" },
          { key: "quality", label: "Listing Quality", status: "fail" as const, message: "Poor quality listing" },
          { key: "freshness", label: "Listing Freshness", status: "caution" as const, message: "Updated 45 days ago" },
          { key: "duplicate", label: "Duplicate Check", status: "fail" as const, message: "Multiple duplicates found" },
          { key: "advertiser", label: "Advertiser Check", status: "fail" as const, message: "Unverified advertiser" },
        ],
      },
    }
    return data[level]
  }

  const currentData = getScoreData(currentRisk)

  const getStatusIcon = (status: "pass" | "caution" | "fail") => {
    switch (status) {
      case "pass":
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case "caution":
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />
      case "fail":
        return <X className="w-4 h-4 text-red-600" />
    }
  }

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded)
  }

  // Collapsed View
  if (!isExpanded) {
    return (
      <div
        className="fixed top-1/2 right-4 transform -translate-y-1/2 z-50 cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg"
        onClick={toggleExpanded}
      >
        <Card className={`${currentData.badgeBgClass} border-0 shadow-lg hover:shadow-xl transition-all duration-200`}>
          <CardContent className="p-3 flex items-center gap-2 text-white">
            <Shield className="w-5 h-5 text-white shield-gradient-collapsed" />
            <div className="text-sm font-bold">{currentData.score}</div>
            <div className="text-xs font-medium">Trust Shield</div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Expanded View
  return (
    <div className="fixed top-1/2 right-4 transform -translate-y-1/2 z-50">
      <Card
        className={`w-80 border-2 ${currentData.bgClass} shadow-2xl transition-all duration-300 ease-in-out transform`}
        style={{
          animation: "expandIn 300ms ease-in-out",
          boxShadow: `0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px ${
            currentRisk === "high"
              ? "rgba(34, 197, 94, 0.1)"
              : currentRisk === "medium"
                ? "rgba(234, 179, 8, 0.1)"
                : "rgba(239, 68, 68, 0.1)"
          }`,
        }}
      >
        <CardHeader className="pb-3 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-slate-600" />
              <h3 className="font-semibold text-slate-800 text-sm">{currentData.title}</h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleExpanded}
              className="h-6 w-6 p-0 hover:bg-slate-100 rounded-full"
            >
              <ChevronUp className="w-4 h-4 text-slate-500" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Main Score Area */}
          <div className="flex items-center gap-4 p-4 bg-white rounded-lg border shadow-sm">
            <div className="relative">
              <Shield className={`w-12 h-12 ${currentData.shieldClass} shield-gradient-${currentRisk} shield-shadow`} />
            </div>
            <div>
              <div className="text-xs text-slate-600 font-medium">Trust & Quality Score</div>
              <div className={`text-3xl font-bold ${currentData.colorClass}`}>{currentData.score}/100</div>
            </div>
          </div>

          {/* Analysis Breakdown */}
          <div className="space-y-3">
            <h4 className="font-semibold text-slate-800 text-sm">Analysis Breakdown</h4>

            <div className="space-y-1 text-xs">
              {currentData.analysis.map((item) => (
                <div key={item.key} className="flex items-center gap-3 p-2 rounded hover:bg-white/50 transition-colors">
                  <div className="flex-shrink-0">{getStatusIcon(item.status)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-slate-700 truncate">{item.label}</div>
                    <div className="text-slate-600 text-xs">{item.message}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* High Risk Action Buttons */}
          {currentRisk === "low" && (
            <div className="pt-3 border-t border-slate-200 space-y-2">
              <Button className="w-full bg-red-600 hover:bg-red-700 text-white font-medium" size="sm">
                <AlertCircle className="w-4 h-4 mr-2" />
                Report this Listing
              </Button>
              <Button
                variant="outline"
                className="w-full border-red-200 text-red-700 hover:bg-red-50 bg-transparent"
                size="sm"
              >
                Learn How to Stay Safe
              </Button>
            </div>
          )}

          {/* Footer */}
          <div className="pt-2 border-t border-slate-200">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-slate-500 hover:text-slate-700 p-0 h-auto font-normal"
            >
              <HelpCircle className="w-3 h-3 mr-1" />
              How is this score calculated?
            </Button>
          </div>
        </CardContent>
      </Card>

      <style jsx>{`
        @keyframes expandIn {
          from {
            opacity: 0;
            transform: scale(0.3) translateY(-20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        
        .shield-gradient-high {
          background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        
        .shield-gradient-medium {
          background: linear-gradient(135deg, #eab308 0%, #ca8a04 100%);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        
        .shield-gradient-low {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        
        .shield-shadow {
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));
        }
      `}</style>
    </div>
  )
}
