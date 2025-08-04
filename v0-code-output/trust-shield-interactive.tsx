"use client"

import { useState } from "react"
import { Shield, CheckCircle, AlertTriangle, X, HelpCircle, ChevronUp, AlertCircle } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface TrustShieldProps {
  score?: number
  riskLevel?: "high" | "medium" | "low"
}

interface AnalysisItem {
  key: string
  label: string
  status: "pass" | "caution" | "fail"
  message: string
}

export default function TrustShieldInteractive({ score = 85, riskLevel = "high" }: TrustShieldProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const getScoreData = (level: "high" | "medium" | "low") => {
    const data = {
      high: {
        score: 85,
        title: "Idealista Trust Shield",
        colorClass: "text-green-600",
        bgClass: "bg-green-50 border-green-200",
        shieldClass: "text-green-600",
        shadowClass: "shadow-green-100",
        analysis: [
          { key: "scam", label: "Scam Keyword Scan", status: "pass" as const, message: "No high-risk language found" },
          {
            key: "price",
            label: "Price Analysis",
            status: "pass" as const,
            message: "Priced appropriately for Gràcia",
          },
          {
            key: "quality",
            label: "Listing Quality",
            status: "pass" as const,
            message: "Includes floor plan & 23 photos",
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
        score: 62,
        title: "Idealista Trust Shield",
        colorClass: "text-yellow-600",
        bgClass: "bg-yellow-50 border-yellow-200",
        shieldClass: "text-yellow-600",
        shadowClass: "shadow-yellow-100",
        analysis: [
          { key: "scam", label: "Scam Keyword Scan", status: "pass" as const, message: "No high-risk language found" },
          {
            key: "price",
            label: "Price Analysis",
            status: "caution" as const,
            message: "Price slightly above market average",
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
        score: 28,
        title: "High Risk Warning",
        colorClass: "text-red-600",
        bgClass: "bg-red-50 border-red-200",
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

  const currentData = getScoreData(riskLevel)

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
        className={`fixed top-4 right-4 z-50 cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg ${currentData.shadowClass}`}
        onClick={toggleExpanded}
      >
        <Card
          className={`w-24 h-20 ${currentData.bgClass} border-2 shadow-md hover:shadow-lg transition-all duration-200`}
        >
          <CardContent className="p-3 flex flex-col items-center justify-center h-full">
            <div className="relative">
              <Shield className={`w-8 h-8 ${currentData.shieldClass} shield-gradient-${riskLevel}`} />
            </div>
            <div className={`text-xs font-bold ${currentData.colorClass} mt-1`}>{currentData.score}/100</div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Expanded View
  return (
    <div className="fixed top-4 right-4 z-50">
      <Card
        className={`w-80 border-2 ${currentData.bgClass} shadow-xl transition-all duration-300 ease-in-out transform ${currentData.shadowClass}`}
        style={{
          animation: "expandIn 300ms ease-in-out",
          boxShadow: `0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04), 0 0 0 1px ${
            riskLevel === "high"
              ? "rgba(34, 197, 94, 0.1)"
              : riskLevel === "medium"
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
              <Shield className={`w-12 h-12 ${currentData.shieldClass} shield-gradient-${riskLevel} shield-shadow`} />
            </div>
            <div>
              <div className="text-xs text-slate-600 font-medium">Trust & Quality Score</div>
              <div className={`text-3xl font-bold ${currentData.colorClass}`}>{currentData.score}/100</div>
            </div>
          </div>

          {/* Analysis Breakdown */}
          <div className="space-y-3">
            <h4 className="font-semibold text-slate-800 text-sm">Analysis Breakdown</h4>

            <div className="space-y-2 text-xs">
              {currentData.analysis.map((item) => (
                <div key={item.key} className="flex items-start gap-2 p-2 rounded hover:bg-white/50 transition-colors">
                  {getStatusIcon(item.status)}
                  <div className="flex-1">
                    <div className="font-medium text-slate-700">{item.label}</div>
                    <div className="text-slate-600">{item.message}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* High Risk Action Button */}
          {riskLevel === "low" && (
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
