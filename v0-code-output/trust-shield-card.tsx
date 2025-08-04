"use client"

import { Shield, CheckCircle, AlertTriangle, X, HelpCircle } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface TrustShieldProps {
  score?: number
  analysis?: {
    scamKeywords: "pass" | "caution" | "fail"
    priceAnalysis: "pass" | "caution" | "fail"
    listingQuality: "pass" | "caution" | "fail"
    listingFreshness: "pass" | "caution" | "fail"
    duplicateCheck: "pass" | "caution" | "fail"
    advertiserCheck: "pass" | "caution" | "fail"
  }
}

export default function TrustShieldCard({
  score = 85,
  analysis = {
    scamKeywords: "pass",
    priceAnalysis: "pass",
    listingQuality: "pass",
    listingFreshness: "pass",
    duplicateCheck: "pass",
    advertiserCheck: "caution",
  },
}: TrustShieldProps) {
  const getScoreColor = (score: number) => {
    if (score >= 75) return "text-green-600"
    if (score >= 50) return "text-yellow-600"
    return "text-red-600"
  }

  const getScoreBgColor = (score: number) => {
    if (score >= 75) return "bg-green-50 border-green-200"
    if (score >= 50) return "bg-yellow-50 border-yellow-200"
    return "bg-red-50 border-red-200"
  }

  const getShieldColor = (score: number) => {
    if (score >= 75) return "text-green-600"
    if (score >= 50) return "text-yellow-600"
    return "text-red-600"
  }

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

  const getStatusText = (check: string, status: "pass" | "caution" | "fail") => {
    const texts = {
      scamKeywords: {
        pass: "No high-risk language found",
        caution: "Some concerning phrases detected",
        fail: "High-risk keywords found",
      },
      priceAnalysis: {
        pass: "Priced appropriately for Gràcia",
        caution: "Price slightly above market average",
        fail: "Price significantly overpriced",
      },
      listingQuality: {
        pass: "Includes floor plan & 23 photos",
        caution: "Limited photos or details",
        fail: "Poor quality listing",
      },
      listingFreshness: {
        pass: "Updated 3 days ago",
        caution: "Updated 2 weeks ago",
        fail: "Not updated in over a month",
      },
      duplicateCheck: {
        pass: "No duplicates found",
        caution: "Similar listings detected",
        fail: "Duplicate listings found",
      },
      advertiserCheck: {
        pass: "Verified professional agency",
        caution: "Agency using generic email",
        fail: "Unverified advertiser",
      },
    }
    return texts[check as keyof typeof texts][status]
  }

  return (
    <Card className={`w-80 shadow-lg border-2 ${getScoreBgColor(score)} fixed top-4 right-4 z-50 font-sans`}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-slate-600" />
          <h3 className="font-semibold text-slate-800 text-sm">Idealista Trust Shield</h3>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Main Score Area */}
        <div className="flex items-center gap-4 p-3 bg-white rounded-lg border">
          <Shield className={`w-12 h-12 ${getShieldColor(score)}`} />
          <div>
            <div className="text-xs text-slate-600 font-medium">Trust & Quality Score</div>
            <div className={`text-3xl font-bold ${getScoreColor(score)}`}>{score}/100</div>
          </div>
        </div>

        {/* Analysis Breakdown */}
        <div className="space-y-3">
          <h4 className="font-semibold text-slate-800 text-sm">Analysis Breakdown</h4>

          <div className="space-y-2 text-xs">
            <div className="flex items-start gap-2">
              {getStatusIcon(analysis.scamKeywords)}
              <div>
                <div className="font-medium text-slate-700">Scam Keyword Scan</div>
                <div className="text-slate-600">{getStatusText("scamKeywords", analysis.scamKeywords)}</div>
              </div>
            </div>

            <div className="flex items-start gap-2">
              {getStatusIcon(analysis.priceAnalysis)}
              <div>
                <div className="font-medium text-slate-700">Price Analysis</div>
                <div className="text-slate-600">{getStatusText("priceAnalysis", analysis.priceAnalysis)}</div>
              </div>
            </div>

            <div className="flex items-start gap-2">
              {getStatusIcon(analysis.listingQuality)}
              <div>
                <div className="font-medium text-slate-700">Listing Quality</div>
                <div className="text-slate-600">{getStatusText("listingQuality", analysis.listingQuality)}</div>
              </div>
            </div>

            <div className="flex items-start gap-2">
              {getStatusIcon(analysis.listingFreshness)}
              <div>
                <div className="font-medium text-slate-700">Listing Freshness</div>
                <div className="text-slate-600">{getStatusText("listingFreshness", analysis.listingFreshness)}</div>
              </div>
            </div>

            <div className="flex items-start gap-2">
              {getStatusIcon(analysis.duplicateCheck)}
              <div>
                <div className="font-medium text-slate-700">Duplicate Check</div>
                <div className="text-slate-600">{getStatusText("duplicateCheck", analysis.duplicateCheck)}</div>
              </div>
            </div>

            <div className="flex items-start gap-2">
              {getStatusIcon(analysis.advertiserCheck)}
              <div>
                <div className="font-medium text-slate-700">Advertiser Check</div>
                <div className="text-slate-600">{getStatusText("advertiserCheck", analysis.advertiserCheck)}</div>
              </div>
            </div>
          </div>
        </div>

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
  )
}
