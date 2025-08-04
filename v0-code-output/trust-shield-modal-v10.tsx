"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { X } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface TrustShieldModalV10Props {
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
  <svg width="16" height="16" viewBox="0 0 16 16" className="trust-shield-text-sage-600">
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
  <svg width="16" height="16" viewBox="0 0 16 16" className="trust-shield-text-ochre-600">
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
  <svg width="16" height="16" viewBox="0 0 16 16" className="trust-shield-text-terracotta-600">
    <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

// Chevron icon that points down when collapsed, up when expanded
const ChevronIcon = ({ isExpanded }: { isExpanded: boolean }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    className={`trust-shield-text-charcoal-60 trust-shield-transition-transform trust-shield-duration-300 trust-shield-ease-in-out ${isExpanded ? "trust-shield-rotate-180" : ""}`}
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

export default function TrustShieldModalV10({
  isOpen,
  onClose,
  score,
  riskLevel,
  isMobile = false,
}: TrustShieldModalV10Props) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const [startY, setStartY] = useState(0)
  const [currentY, setCurrentY] = useState(0)
  const [isDragging, setIsDragging] = useState(false)

  // Reset accordion state when modal opens
  useEffect(() => {
    if (isOpen) {
      setExpandedItems(new Set())
    }
  }, [isOpen])

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
        titleColor: "trust-shield-text-sage-600",
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
        titleColor: "trust-shield-text-ochre-600",
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
        titleColor: "trust-shield-text-terracotta-600",
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
            duplicateLink: "https://example.com/duplicate-listing-123",
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
      <div className="trust-shield-fixed trust-shield-inset-0 trust-shield-z-50 trust-shield-flex trust-shield-items-end trust-shield-justify-center">
        {/* Backdrop */}
        <div
          className="trust-shield-absolute trust-shield-inset-0 trust-shield-bg-black-30 trust-shield-backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Bottom Sheet */}
        <div
          className="trust-shield-relative trust-shield-z-10 trust-shield-w-full trust-shield-bg-cream trust-shield-rounded-t-2xl trust-shield-shadow-2xl trust-shield-max-h-80vh trust-shield-overflow-y-auto"
          style={{
            transform: `translateY(${currentY}px)`,
            transition: isDragging ? "none" : "transform 400ms cubic-bezier(0.4, 0, 0.2, 1)",
            marginTop: "10vh", // Reduced top margin for better connection
          }}
        >
          {/* Drag handle */}
          <div className="trust-shield-flex trust-shield-justify-center trust-shield-pt-3 trust-shield-pb-2">
            <div className="trust-shield-w-12 trust-shield-h-1 trust-shield-bg-charcoal-20 trust-shield-rounded-full" />
          </div>

          <div className="trust-shield-modal-background">
            <div className="trust-shield-p-6">
              {/* Header */}
              <div className="trust-shield-flex trust-shield-items-center trust-shield-justify-between trust-shield-mb-6">
                <div className="trust-shield-flex trust-shield-items-center trust-shield-gap-3">
                  <HandDrawnShield className={`${currentData.titleColor} trust-shield-hand-drawn-shield`} size={24} />
                  <div>
                    <h3
                      className={`trust-shield-font-medium trust-shield-text-xl trust-shield-font-serif ${currentData.titleColor}`}
                    >
                      Idealista Trust Shield
                    </h3>
                    <div
                      className={`trust-shield-text-2xl trust-shield-font-bold ${currentData.titleColor} trust-shield-font-rounded`}
                    >
                      {currentData.score}/100
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="trust-shield-h-8 trust-shield-w-8 trust-shield-p-0 hover:trust-shield-bg-charcoal-10 trust-shield-rounded-full focus:trust-shield-outline-none focus:trust-shield-ring-2 focus:trust-shield-ring-blue-500"
                  aria-label="Close modal"
                >
                  <X className="trust-shield-w-4 trust-shield-h-4 trust-shield-text-charcoal" />
                </Button>
              </div>

              {/* AI Summary */}
              <div className="trust-shield-mb-6">
                <p className="trust-shield-text-sm trust-shield-text-charcoal trust-shield-font-serif trust-shield-leading-relaxed">
                  {currentData.summary}
                </p>
              </div>

              {/* Analysis Breakdown */}
              <div className="trust-shield-space-y-0">
                <h4 className="trust-shield-font-medium trust-shield-text-charcoal trust-shield-text-sm trust-shield-font-rounded trust-shield-mb-4">
                  Analysis Breakdown
                </h4>
                <div className="trust-shield-space-y-0">
                  {currentData.analysis.map((item, index) => (
                    <div key={item.key}>
                      <button
                        className="trust-shield-w-full trust-shield-flex trust-shield-items-center trust-shield-gap-3 trust-shield-py-3 trust-shield-cursor-pointer hover:trust-shield-bg-white-30 trust-shield-rounded trust-shield-transition-colors focus:trust-shield-outline-none focus:trust-shield-bg-white-40 focus:trust-shield-ring-2 focus:trust-shield-ring-blue-500 focus:trust-shield-ring-inset"
                        onClick={() => toggleItemExpansion(item.key)}
                        onKeyDown={(e) => handleKeyDown(e, item.key)}
                        aria-expanded={expandedItems.has(item.key)}
                        aria-controls={`analysis-${item.key}`}
                      >
                        <div className="trust-shield-flex-shrink-0">{getStatusIcon(item.status)}</div>
                        <div className="trust-shield-flex-1 trust-shield-min-w-0 trust-shield-text-left">
                          <div className="trust-shield-flex trust-shield-items-center trust-shield-gap-2">
                            <span className="trust-shield-font-medium trust-shield-text-charcoal trust-shield-text-sm trust-shield-font-rounded">
                              {item.label}
                            </span>
                            <span className="trust-shield-text-charcoal-50 trust-shield-text-sm trust-shield-font-rounded">
                              • {item.summary}
                            </span>
                          </div>
                        </div>
                        <div className="trust-shield-flex-shrink-0">
                          <ChevronIcon isExpanded={expandedItems.has(item.key)} />
                        </div>
                      </button>

                      <div
                        id={`analysis-${item.key}`}
                        className={`trust-shield-overflow-hidden trust-shield-transition-all trust-shield-duration-300 trust-shield-ease-in-out ${
                          expandedItems.has(item.key)
                            ? "trust-shield-max-h-96 trust-shield-opacity-100"
                            : "trust-shield-max-h-0 trust-shield-opacity-0"
                        }`}
                      >
                        <div className="trust-shield-pl-7 trust-shield-pr-8 trust-shield-pb-3">
                          <div className="trust-shield-text-xs trust-shield-text-charcoal-80 trust-shield-font-rounded trust-shield-mb-2">
                            <strong>Data point:</strong> {item.detail}
                            {item.duplicateLink && (
                              <div className="trust-shield-mt-2">
                                <a
                                  href={item.duplicateLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="trust-shield-text-blue-600 hover:trust-shield-text-blue-800 trust-shield-underline focus:trust-shield-outline-none focus:trust-shield-ring-2 focus:trust-shield-ring-blue-500 trust-shield-rounded"
                                >
                                  View duplicate listing →
                                </a>
                              </div>
                            )}
                          </div>
                          <div className="trust-shield-text-xs trust-shield-text-charcoal-70 trust-shield-font-rounded">
                            <strong>Why this matters:</strong> {item.explanation}
                          </div>
                        </div>
                      </div>

                      {index < currentData.analysis.length - 1 && (
                        <div className="trust-shield-border-b trust-shield-border-charcoal-10" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Action buttons for high risk */}
              {riskLevel === "low" && (
                <div className="trust-shield-space-y-2 trust-shield-pt-6 trust-shield-border-t trust-shield-border-charcoal-10 trust-shield-mt-6">
                  <Button
                    className="trust-shield-w-full trust-shield-bg-terracotta-600 hover:trust-shield-bg-terracotta-700 trust-shield-text-white trust-shield-font-rounded focus:trust-shield-outline-none focus:trust-shield-ring-2 focus:trust-shield-ring-blue-500"
                    size="sm"
                  >
                    Report this Listing
                  </Button>
                  <Button
                    variant="outline"
                    className="trust-shield-w-full trust-shield-border-terracotta-200 trust-shield-text-terracotta-700 hover:trust-shield-bg-terracotta-50 trust-shield-bg-transparent trust-shield-font-rounded focus:trust-shield-outline-none focus:trust-shield-ring-2 focus:trust-shield-ring-blue-500 bg-transparent"
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
    <div className="trust-shield-fixed trust-shield-inset-0 trust-shield-z-50 trust-shield-flex trust-shield-items-center trust-shield-justify-center">
      {/* Backdrop */}
      <div
        className="trust-shield-absolute trust-shield-inset-0 trust-shield-bg-black-30 trust-shield-backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="trust-shield-relative trust-shield-z-10 trust-shield-max-w-lg trust-shield-w-full trust-shield-mx-4 trust-shield-max-h-90vh trust-shield-overflow-y-auto">
        <Card className="trust-shield-bg-cream trust-shield-border-0 trust-shield-shadow-2xl">
          <div className="trust-shield-modal-background">
            <CardHeader className="trust-shield-pb-4 trust-shield-relative">
              <div className="trust-shield-flex trust-shield-items-center trust-shield-justify-between">
                <div className="trust-shield-flex trust-shield-items-center trust-shield-gap-3">
                  <HandDrawnShield className={`${currentData.titleColor} trust-shield-hand-drawn-shield`} size={28} />
                  <div>
                    <h3
                      className={`trust-shield-font-medium trust-shield-text-2xl trust-shield-font-serif ${currentData.titleColor}`}
                    >
                      Idealista Trust Shield
                    </h3>
                    <div
                      className={`trust-shield-text-3xl trust-shield-font-bold ${currentData.titleColor} trust-shield-font-rounded`}
                    >
                      {currentData.score}/100
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="trust-shield-h-8 trust-shield-w-8 trust-shield-p-0 hover:trust-shield-bg-charcoal-10 trust-shield-rounded-full focus:trust-shield-outline-none focus:trust-shield-ring-2 focus:trust-shield-ring-blue-500"
                  aria-label="Close modal"
                >
                  <X className="trust-shield-w-4 trust-shield-h-4 trust-shield-text-charcoal" />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="trust-shield-pt-0 trust-shield-pb-8">
              {/* AI Summary */}
              <div className="trust-shield-mb-6">
                <p className="trust-shield-text-sm trust-shield-text-charcoal trust-shield-font-serif trust-shield-leading-relaxed">
                  {currentData.summary}
                </p>
              </div>

              {/* Analysis Breakdown */}
              <div className="trust-shield-space-y-0">
                <h4 className="trust-shield-font-medium trust-shield-text-charcoal trust-shield-text-sm trust-shield-font-rounded trust-shield-mb-4">
                  Analysis Breakdown
                </h4>
                <div className="trust-shield-space-y-0">
                  {currentData.analysis.map((item, index) => (
                    <div key={item.key}>
                      <button
                        className="trust-shield-w-full trust-shield-flex trust-shield-items-center trust-shield-gap-3 trust-shield-py-3 trust-shield-cursor-pointer hover:trust-shield-bg-white-30 trust-shield-rounded trust-shield-transition-colors focus:trust-shield-outline-none focus:trust-shield-bg-white-40 focus:trust-shield-ring-2 focus:trust-shield-ring-blue-500 focus:trust-shield-ring-inset"
                        onClick={() => toggleItemExpansion(item.key)}
                        onKeyDown={(e) => handleKeyDown(e, item.key)}
                        aria-expanded={expandedItems.has(item.key)}
                        aria-controls={`analysis-${item.key}`}
                      >
                        <div className="trust-shield-flex-shrink-0">{getStatusIcon(item.status)}</div>
                        <div className="trust-shield-flex-1 trust-shield-min-w-0 trust-shield-text-left">
                          <div className="trust-shield-flex trust-shield-items-center trust-shield-gap-2">
                            <span className="trust-shield-font-medium trust-shield-text-charcoal trust-shield-text-sm trust-shield-font-rounded">
                              {item.label}
                            </span>
                            <span className="trust-shield-text-charcoal-50 trust-shield-text-sm trust-shield-font-rounded">
                              • {item.summary}
                            </span>
                          </div>
                        </div>
                        <div className="trust-shield-flex-shrink-0">
                          <ChevronIcon isExpanded={expandedItems.has(item.key)} />
                        </div>
                      </button>

                      <div
                        id={`analysis-${item.key}`}
                        className={`trust-shield-overflow-hidden trust-shield-transition-all trust-shield-duration-300 trust-shield-ease-in-out ${
                          expandedItems.has(item.key)
                            ? "trust-shield-max-h-96 trust-shield-opacity-100"
                            : "trust-shield-max-h-0 trust-shield-opacity-0"
                        }`}
                      >
                        <div className="trust-shield-pl-7 trust-shield-pr-8 trust-shield-pb-3">
                          <div className="trust-shield-text-xs trust-shield-text-charcoal-80 trust-shield-font-rounded trust-shield-mb-2">
                            <strong>Data point:</strong> {item.detail}
                            {item.duplicateLink && (
                              <div className="trust-shield-mt-2">
                                <a
                                  href={item.duplicateLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="trust-shield-text-blue-600 hover:trust-shield-text-blue-800 trust-shield-underline focus:trust-shield-outline-none focus:trust-shield-ring-2 focus:trust-shield-ring-blue-500 trust-shield-rounded"
                                >
                                  View duplicate listing →
                                </a>
                              </div>
                            )}
                          </div>
                          <div className="trust-shield-text-xs trust-shield-text-charcoal-70 trust-shield-font-rounded">
                            <strong>Why this matters:</strong> {item.explanation}
                          </div>
                        </div>
                      </div>

                      {index < currentData.analysis.length - 1 && (
                        <div className="trust-shield-border-b trust-shield-border-charcoal-10" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Action buttons for high risk */}
              {riskLevel === "low" && (
                <div className="trust-shield-space-y-2 trust-shield-pt-6 trust-shield-border-t trust-shield-border-charcoal-10 trust-shield-mt-6">
                  <Button
                    className="trust-shield-w-full trust-shield-bg-terracotta-600 hover:trust-shield-bg-terracotta-700 trust-shield-text-white trust-shield-font-rounded focus:trust-shield-outline-none focus:trust-shield-ring-2 focus:trust-shield-ring-blue-500"
                    size="sm"
                  >
                    Report this Listing
                  </Button>
                  <Button
                    variant="outline"
                    className="trust-shield-w-full trust-shield-border-terracotta-200 trust-shield-text-terracotta-700 hover:trust-shield-bg-terracotta-50 trust-shield-bg-transparent trust-shield-font-rounded focus:trust-shield-outline-none focus:trust-shield-ring-2 focus:trust-shield-ring-blue-500 bg-transparent"
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
    </div>
  )
}
