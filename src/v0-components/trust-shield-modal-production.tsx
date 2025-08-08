"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { X } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface TrustShieldModalProductionProps {
  isOpen: boolean
  onClose: () => void
  score: number
  riskLevel: "high" | "medium" | "low"
  isMobile?: boolean
}

// Consistent hand-drawn shield icon
const HandDrawnShield = ({ className, size = 28 }: { className?: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
    <path
      d="M12 2L3 7V12C3 16.55 6.84 20.74 12 22C17.16 20.74 21 16.55 21 12V7L12 2Z"
      stroke="currentColor"
      strokeWidth="1.5"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{
        strokeDasharray: "0.3 0.7",
        strokeDashoffset: "0.1",
      }}
    />
  </svg>
)

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

// Chevron icon that points down when collapsed, up when expanded
const ChevronIcon = ({ isExpanded }: { isExpanded: boolean }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    className={`text-charcoal/60 transition-transform duration-300 ease-in-out ${isExpanded ? "rotate-180" : ""}`}
  >
    <path
      d="M4 6l4 4 4-4"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

export default function TrustShieldModalProduction({
  isOpen,
  onClose,
  score,
  riskLevel,
  isMobile = false,
}: TrustShieldModalProductionProps) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const [startY, setStartY] = useState(0)
  const [currentY, setCurrentY] = useState(0)
  const [isDragging, setIsDragging] = useState(false)

  // Handle mobile swipe to dismiss
  useEffect(() => {
    if (!isMobile || !isOpen) return

    const handleTouchStart = (e: TouchEvent) => {
      setStartY(e.touches[0].clientY)
      setIsDragging(true)
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging) return
      const deltaY = e.touches[0].clientY - startY
      if (deltaY > 0) {
        setCurrentY(deltaY)
      }
    }

    const handleTouchEnd = () => {
      if (currentY > 100) {
        onClose()
      }
      setCurrentY(0)
      setIsDragging(false)
    }

    document.addEventListener("touchstart", handleTouchStart)
    document.addEventListener("touchmove", handleTouchMove)
    document.addEventListener("touchend", handleTouchEnd)

    return () => {
      document.removeEventListener("touchstart", handleTouchStart)
      document.removeEventListener("touchmove", handleTouchMove)
      document.removeEventListener("touchend", handleTouchEnd)
    }
  }, [isMobile, isOpen, startY, currentY, isDragging, onClose])

  if (!isOpen) return null

  const getScoreData = (level: "high" | "medium" | "low") => {
    const data = {
      high: {
        score: score || 85,
        titleColor: "text-sage-600",
        summary:
          "This listing looks very promising and appears to be from a serious seller. It includes plenty of detail and has no major red flags detected.",
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
        titleColor: "text-ochre-600",
        summary: "This listing has some concerns but may still be legitimate. Exercise normal caution when proceeding.",
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
        titleColor: "text-terracotta-600",
        summary:
          "Please proceed with caution on this one. This listing contains several characteristics commonly associated with fraudulent posts.",
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

  const handleKeyDown = (e: React.KeyboardEvent, key: string) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      toggleItemExpansion(key)
    }
  }

  // Mobile bottom sheet modal
  if (isMobile) {
    return (
      <div className="fixed inset-0 z-50 flex items-end justify-center">
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

        {/* Bottom Sheet */}
        <div
          className="relative z-10 w-full bg-cream rounded-t-2xl shadow-2xl max-h-[80vh] overflow-y-auto"
          style={{
            transform: `translateY(${currentY}px)`,
            transition: isDragging ? "none" : "transform 300ms ease-out",
          }}
        >
          {/* Drag handle */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-12 h-1 bg-charcoal/20 rounded-full" />
          </div>

          <div className="modal-background">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <HandDrawnShield className={`${currentData.titleColor} hand-drawn-shield`} size={24} />
                  <div>
                    <h3 className={`font-medium text-lg font-serif ${currentData.titleColor}`}>
                      Idealista Trust Shield
                    </h3>
                    <div className={`text-xl font-bold ${currentData.titleColor} font-rounded`}>
                      {currentData.score}/100
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="h-8 w-8 p-0 hover:bg-charcoal/10 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label="Close modal"
                >
                  <X className="w-4 h-4 text-charcoal" />
                </Button>
              </div>

              {/* AI Summary */}
              <div className="mb-6">
                <p className="text-sm text-charcoal font-serif leading-relaxed">{currentData.summary}</p>
              </div>

              {/* Analysis Breakdown */}
              <div className="space-y-0">
                <h4 className="font-medium text-charcoal text-sm font-rounded mb-4">Analysis Breakdown</h4>
                <div className="space-y-0">
                  {currentData.analysis.map((item, index) => (
                    <div key={item.key}>
                      <button
                        className="w-full flex items-center gap-3 py-3 cursor-pointer hover:bg-white/30 rounded transition-colors focus:outline-none focus:bg-white/40 focus:ring-2 focus:ring-blue-500 focus:ring-inset"
                        onClick={() => toggleItemExpansion(item.key)}
                        onKeyDown={(e) => handleKeyDown(e, item.key)}
                        aria-expanded={expandedItems.has(item.key)}
                        aria-controls={`analysis-${item.key}`}
                      >
                        <div className="flex-shrink-0">{getStatusIcon(item.status)}</div>
                        <div className="flex-1 min-w-0 text-left">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-charcoal text-sm font-rounded">{item.label}</span>
                            <span className="text-charcoal/70 text-sm font-rounded">• {item.summary}</span>
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          <ChevronIcon isExpanded={expandedItems.has(item.key)} />
                        </div>
                      </button>

                      <div
                        id={`analysis-${item.key}`}
                        className={`overflow-hidden transition-all duration-300 ease-in-out ${
                          expandedItems.has(item.key) ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                        }`}
                      >
                        <div className="pl-7 pr-8 pb-3">
                          <div className="text-xs text-charcoal/80 font-rounded mb-2">
                            <strong>Data point:</strong> {item.detail}
                          </div>
                          <div className="text-xs text-charcoal/70 font-rounded">
                            <strong>Why this matters:</strong> {item.explanation}
                          </div>
                        </div>
                      </div>

                      {index < currentData.analysis.length - 1 && <div className="border-b border-charcoal/10" />}
                    </div>
                  ))}
                </div>
              </div>

              {/* Action buttons for high risk */}
              {riskLevel === "low" && (
                <div className="space-y-2 pt-6 border-t border-charcoal/10 mt-6">
                  <Button
                    className="w-full bg-terracotta-600 hover:bg-terracotta-700 text-white font-rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    size="sm"
                  >
                    Report this Listing
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full border-terracotta-200 text-terracotta-700 hover:bg-terracotta-50 bg-transparent font-rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    size="sm"
                  >
                    Safety Tips
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Desktop modal
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      {/* Modal Content */}
      <div className="relative z-10 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        <Card className="bg-cream border-0 shadow-2xl">
          <div className="modal-background">
            <CardHeader className="pb-4 relative">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <HandDrawnShield className={`${currentData.titleColor} hand-drawn-shield`} size={28} />
                  <div>
                    <h3 className={`font-medium text-xl font-serif ${currentData.titleColor}`}>
                      Idealista Trust Shield
                    </h3>
                    <div className={`text-2xl font-bold ${currentData.titleColor} font-rounded`}>
                      {currentData.score}/100
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="h-8 w-8 p-0 hover:bg-charcoal/10 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label="Close modal"
                >
                  <X className="w-4 h-4 text-charcoal" />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="pt-0 pb-8">
              {/* AI Summary */}
              <div className="mb-6">
                <p className="text-sm text-charcoal font-serif leading-relaxed">{currentData.summary}</p>
              </div>

              {/* Analysis Breakdown */}
              <div className="space-y-0">
                <h4 className="font-medium text-charcoal text-sm font-rounded mb-4">Analysis Breakdown</h4>
                <div className="space-y-0">
                  {currentData.analysis.map((item, index) => (
                    <div key={item.key}>
                      <button
                        className="w-full flex items-center gap-3 py-3 cursor-pointer hover:bg-white/30 rounded transition-colors focus:outline-none focus:bg-white/40 focus:ring-2 focus:ring-blue-500 focus:ring-inset"
                        onClick={() => toggleItemExpansion(item.key)}
                        onKeyDown={(e) => handleKeyDown(e, item.key)}
                        aria-expanded={expandedItems.has(item.key)}
                        aria-controls={`analysis-${item.key}`}
                      >
                        <div className="flex-shrink-0">{getStatusIcon(item.status)}</div>
                        <div className="flex-1 min-w-0 text-left">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-charcoal text-sm font-rounded">{item.label}</span>
                            <span className="text-charcoal/70 text-sm font-rounded">• {item.summary}</span>
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          <ChevronIcon isExpanded={expandedItems.has(item.key)} />
                        </div>
                      </button>

                      <div
                        id={`analysis-${item.key}`}
                        className={`overflow-hidden transition-all duration-300 ease-in-out ${
                          expandedItems.has(item.key) ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                        }`}
                      >
                        <div className="pl-7 pr-8 pb-3">
                          <div className="text-xs text-charcoal/80 font-rounded mb-2">
                            <strong>Data point:</strong> {item.detail}
                          </div>
                          <div className="text-xs text-charcoal/70 font-rounded">
                            <strong>Why this matters:</strong> {item.explanation}
                          </div>
                        </div>
                      </div>

                      {index < currentData.analysis.length - 1 && <div className="border-b border-charcoal/10" />}
                    </div>
                  ))}
                </div>
              </div>

              {/* Action buttons for high risk */}
              {riskLevel === "low" && (
                <div className="space-y-2 pt-6 border-t border-charcoal/10 mt-6">
                  <Button
                    className="w-full bg-terracotta-600 hover:bg-terracotta-700 text-white font-rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    size="sm"
                  >
                    Report this Listing
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full border-terracotta-200 text-terracotta-700 hover:bg-terracotta-50 bg-transparent font-rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    size="sm"
                  >
                    Safety Tips
                  </Button>
                </div>
              )}
            </CardContent>
          </div>
        </Card>
      </div>

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
        .bg-terracotta-600 {
          background-color: #c17b6b;
        }
        .bg-terracotta-700 {
          background-color: #b06b5a;
        }
        .border-charcoal\\/10 {
          border-color: rgba(74, 74, 74, 0.1);
        }
        .hover\\:bg-charcoal\\/10:hover {
          background-color: rgba(74, 74, 74, 0.1);
        }
        .font-rounded {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          font-feature-settings: 'cv02', 'cv03', 'cv04', 'cv11';
        }
        .font-serif {
          font-family: 'Lora', 'Playfair Display', Georgia, serif;
          font-weight: 500;
        }
        .hand-drawn-shield {
          filter: drop-shadow(0 1px 2px rgba(74, 74, 74, 0.1));
        }
        .modal-background {
          position: relative;
        }
        .modal-background::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: -1;
          background-image: none; /* Ready for texture overlay */
          pointer-events: none;
        }
      `}</style>
    </div>
  )
}
