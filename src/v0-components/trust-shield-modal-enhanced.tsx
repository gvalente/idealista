"use client"

import { useState } from "react"
import { X, ChevronDown, ChevronRight } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface TrustShieldModalEnhancedProps {
  isOpen: boolean
  onClose: () => void
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

export default function TrustShieldModalEnhanced({ isOpen, onClose, score, riskLevel }: TrustShieldModalEnhancedProps) {
  const [showCalculations, setShowCalculations] = useState(false)
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())

  if (!isOpen) return null

  const getScoreData = (level: "high" | "medium" | "low") => {
    const data = {
      high: {
        score: score || 85,
        title: "Trust Shield",
        colorClass: "text-sage-700",
        bgClass: "bg-sage-50",
        analysis: [
          {
            key: "scam",
            label: "Scam Keywords",
            status: "pass" as const,
            summary: "Clean language",
            detail: "Contains a floor plan and 23 high-quality photos",
            explanation:
              "High-quality listings with comprehensive visual information typically indicate legitimate advertisers. This factor contributes 15% to the overall score.",
          },
          {
            key: "price",
            label: "Price Check",
            status: "pass" as const,
            summary: "Fair market price",
            detail: "Priced at €2,469/month for 119m² in Eixample",
            explanation:
              "Price analysis compares against 847 similar properties in the area. This listing falls within the expected range (€18-24/m²). Price accuracy contributes 25% to the overall score.",
          },
          {
            key: "quality",
            label: "Listing Quality",
            status: "pass" as const,
            summary: "Excellent presentation",
            detail: "Professional photos, detailed description, floor plan included",
            explanation:
              "Quality assessment considers photo count, description length, and additional materials. This listing exceeds quality benchmarks. Contributes 20% to overall score.",
          },
          {
            key: "freshness",
            label: "Freshness",
            status: "pass" as const,
            summary: "Recently updated",
            detail: "Last updated 3 days ago",
            explanation:
              "Recent updates indicate active management. Listings updated within 7 days receive full points. Contributes 10% to overall score.",
          },
          {
            key: "duplicate",
            label: "Duplicates",
            status: "pass" as const,
            summary: "Unique listing",
            detail: "No identical listings found across platforms",
            explanation:
              "Duplicate detection scans 12 major property platforms. Unique listings indicate legitimate advertisers. Contributes 15% to overall score.",
          },
          {
            key: "advertiser",
            label: "Advertiser",
            status: "caution" as const,
            summary: "Generic contact",
            detail: "Uses generic email domain (@gmail.com)",
            explanation:
              "Professional agencies typically use branded email addresses. Generic emails reduce confidence but don't indicate fraud. Contributes 15% to overall score.",
          },
        ],
      },
      medium: {
        score: score || 62,
        title: "Trust Shield",
        colorClass: "text-ochre-700",
        bgClass: "bg-ochre-50",
        analysis: [
          {
            key: "scam",
            label: "Scam Keywords",
            status: "pass" as const,
            summary: "Clean language",
            detail: "No suspicious phrases detected",
            explanation:
              "Scam detection analyzes text for 247 known fraudulent patterns. This listing passes all checks.",
          },
          {
            key: "price",
            label: "Price Check",
            status: "caution" as const,
            summary: "Above average",
            detail: "15% higher than similar properties",
            explanation:
              "Price is elevated but within reasonable bounds for the area. May indicate premium features or overpricing.",
          },
          {
            key: "quality",
            label: "Listing Quality",
            status: "caution" as const,
            summary: "Limited details",
            detail: "Only 8 photos, no floor plan",
            explanation:
              "Fewer visual materials than typical quality listings. May indicate less professional presentation.",
          },
          {
            key: "freshness",
            label: "Freshness",
            status: "caution" as const,
            summary: "Older listing",
            detail: "Last updated 24 days ago",
            explanation: "Listings not updated recently may indicate less active management or availability issues.",
          },
          {
            key: "duplicate",
            label: "Duplicates",
            status: "pass" as const,
            summary: "Unique listing",
            detail: "No duplicates found",
            explanation: "This listing appears to be unique across all monitored platforms.",
          },
          {
            key: "advertiser",
            label: "Advertiser",
            status: "caution" as const,
            summary: "Generic contact",
            detail: "Uses generic email domain",
            explanation: "Generic email addresses are common but reduce professional credibility.",
          },
        ],
      },
      low: {
        score: score || 28,
        title: "Trust Shield",
        colorClass: "text-terracotta-700",
        bgClass: "bg-terracotta-50",
        analysis: [
          {
            key: "scam",
            label: "Scam Keywords",
            status: "fail" as const,
            summary: "Suspicious phrases",
            detail: "Contains phrases like 'urgent sale' and 'cash only'",
            explanation: "Multiple high-risk phrases detected that are commonly used in fraudulent listings.",
          },
          {
            key: "price",
            label: "Price Check",
            status: "fail" as const,
            summary: "Unusually low",
            detail: "45% below market average",
            explanation:
              "Significantly below-market pricing is a common indicator of fraudulent listings designed to attract victims.",
          },
          {
            key: "quality",
            label: "Listing Quality",
            status: "fail" as const,
            summary: "Poor presentation",
            detail: "Only 3 low-quality photos, minimal description",
            explanation:
              "Very limited visual information and description suggest unprofessional or fraudulent listing.",
          },
          {
            key: "freshness",
            label: "Freshness",
            status: "caution" as const,
            summary: "Old listing",
            detail: "Last updated 45 days ago",
            explanation: "Long periods without updates may indicate abandoned or fraudulent listings.",
          },
          {
            key: "duplicate",
            label: "Duplicates",
            status: "fail" as const,
            summary: "Multiple copies",
            detail: "Found on 4 different platforms with varying prices",
            explanation: "Same property advertised at different prices across platforms is a strong fraud indicator.",
          },
          {
            key: "advertiser",
            label: "Advertiser",
            status: "fail" as const,
            summary: "Unverified contact",
            detail: "No verifiable contact information",
            explanation: "Lack of verifiable contact details is a major red flag for fraudulent listings.",
          },
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

  const toggleItemExpansion = (key: string) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(key)) {
      newExpanded.delete(key)
    } else {
      newExpanded.add(key)
    }
    setExpandedItems(newExpanded)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      {/* Modal Content */}
      <div className="relative z-10 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        <Card className="bg-cream border-0 shadow-2xl textured-background">
          <CardHeader className="pb-3 relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="absolute top-2 right-2 h-8 w-8 p-0 hover:bg-charcoal/10 rounded-full"
            >
              <X className="w-4 h-4 text-charcoal" />
            </Button>
          </CardHeader>
          <CardContent className="pt-0 pb-8">
            <div className={`${currentData.bgClass} rounded-xl p-6 border border-charcoal/10 relative`}>
              {/* Header */}
              <div className="flex items-center gap-3 mb-6">
                <div className="relative">
                  <svg
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    className={`${currentData.colorClass} hand-drawn-shield`}
                  >
                    <path
                      d="M12 2L3 7V12C3 16.55 6.84 20.74 12 22C17.16 20.74 21 16.55 21 12V7L12 2Z"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium text-charcoal text-lg font-rounded">{currentData.title}</h3>
                  <div className={`text-2xl font-bold ${currentData.colorClass} font-rounded`}>
                    {currentData.score}/100
                  </div>
                </div>
              </div>

              {/* Analysis items */}
              <div className="space-y-3 mb-6">
                <h4 className="font-medium text-charcoal text-sm font-rounded mb-3">Analysis Summary</h4>
                <div className="space-y-2">
                  {currentData.analysis.map((item) => (
                    <div key={item.key} className="bg-cream/50 rounded-lg border border-charcoal/5">
                      <div className="flex items-center gap-3 p-3">
                        <div className="flex-shrink-0">{getStatusIcon(item.status)}</div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-charcoal text-sm font-rounded">{item.label}</div>
                          <div className="text-charcoal/70 text-xs font-rounded">{item.summary}</div>
                        </div>
                        {showCalculations && (
                          <button
                            onClick={() => toggleItemExpansion(item.key)}
                            className="flex-shrink-0 p-1 hover:bg-charcoal/10 rounded transition-colors"
                          >
                            {expandedItems.has(item.key) ? (
                              <ChevronDown className="w-4 h-4 text-charcoal/60" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-charcoal/60" />
                            )}
                          </button>
                        )}
                      </div>

                      {showCalculations && expandedItems.has(item.key) && (
                        <div className="px-3 pb-3 border-t border-charcoal/5 mt-2 pt-3 animate-expand">
                          <div className="text-xs text-charcoal/80 font-rounded mb-2">
                            <strong>Data point:</strong> {item.detail}
                          </div>
                          <div className="text-xs text-charcoal/70 font-rounded">
                            <strong>Why this matters:</strong> {item.explanation}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Show Calculations Button */}
              <div className="mb-6">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCalculations(!showCalculations)}
                  className="text-sm text-charcoal/70 hover:text-charcoal p-0 h-auto font-rounded"
                >
                  {showCalculations ? "Hide Calculations" : "Show Calculations"}
                </Button>
              </div>

              {/* Action buttons for high risk */}
              {riskLevel === "low" && (
                <div className="space-y-2 pt-4 border-t border-charcoal/10">
                  <Button
                    className="w-full bg-terracotta-600 hover:bg-terracotta-700 text-white font-rounded"
                    size="sm"
                  >
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

              {/* Cute illustration in bottom right */}
              <div className="absolute bottom-4 right-4 opacity-60">
                <img
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Gemini%20Generated%20Image-tdW8037cfeBItkneEHJSUpDx93DDmL.png"
                  alt="Trust Shield mascot"
                  className="w-12 h-12"
                />
              </div>
            </div>
          </CardContent>
        </Card>
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
        .hover\\:bg-charcoal\\/10:hover {
          background-color: rgba(74, 74, 74, 0.1);
        }
        .font-rounded {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          font-feature-settings: 'cv02', 'cv03', 'cv04', 'cv11';
        }
        .hand-drawn-shield {
          filter: drop-shadow(0 1px 2px rgba(74, 74, 74, 0.1));
        }
        .textured-background {
          background-image: 
            radial-gradient(circle at 1px 1px, rgba(74,74,74,0.03) 1px, transparent 0);
          background-size: 20px 20px;
        }
        @keyframes expand {
          from {
            opacity: 0;
            max-height: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            max-height: 200px;
            transform: translateY(0);
          }
        }
        .animate-expand {
          animation: expand 300ms ease-out;
        }
      `}</style>
    </div>
  )
}
