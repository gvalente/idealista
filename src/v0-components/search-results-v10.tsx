"use client"

import { useState, useEffect } from "react"
import TrustBadgeV10 from "./trust-badge-v10"
import TrustShieldModalV10 from "./trust-shield-modal-v10"
import { Button } from "@/components/ui/button"
import { Heart, Phone, MessageSquare, ToggleLeft, ToggleRight } from "lucide-react"

const mockListings = [
  {
    id: 1,
    image: "/placeholder.svg?height=200&width=300",
    title: "Flat / apartment in Calle de les Camèlies, La Salut, Barcelona",
    price: "1,263",
    details: "1 bed, 83 m², 2nd floor interior with lift",
    description: "Completely renovated apartment on Camèlies Street...",
    trustScore: 87,
    riskLevel: "high" as const,
    loadingDelay: Math.random() * 150 + 100,
  },
  {
    id: 2,
    image: "/placeholder.svg?height=200&width=300",
    title: "Flat / apartment in Vila de Gràcia, Barcelona",
    price: "2,095",
    details: "1 bed, 59 m², 2nd floor interior with lift",
    description: "AVAILABILITY AND VISITS: Available from 13/08/2025...",
    trustScore: 64,
    riskLevel: "medium" as const,
    loadingDelay: Math.random() * 150 + 100,
  },
  {
    id: 3,
    image: "/placeholder.svg?height=200&width=300",
    title: "Flat / apartment in Vila de Gràcia, Barcelona",
    price: "1,350",
    details: "2 bed, 48 m², exterior without lift",
    description: "Temporary rental in Vila de Gràcia TEMPORARY RENTAL...",
    trustScore: 31,
    riskLevel: "low" as const,
    loadingDelay: Math.random() * 150 + 100,
  },
  {
    id: 4,
    image: "/placeholder.svg?height=200&width=300",
    title: "Penthouse in Vila de Gràcia, Barcelona",
    price: "2,950",
    details: "2 bed, 90 m², 5th floor exterior with lift",
    description: "Exclusive temporary penthouse just steps from Paseo de Gràcia...",
    trustScore: 92,
    riskLevel: "high" as const,
    loadingDelay: Math.random() * 150 + 100,
  },
]

export default function SearchResultsV10() {
  const [hideUntrustworthy, setHideUntrustworthy] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [modalData, setModalData] = useState<{
    isOpen: boolean
    score: number
    riskLevel: "high" | "medium" | "low"
  }>({
    isOpen: false,
    score: 0,
    riskLevel: "high",
  })

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  const filteredListings = hideUntrustworthy ? mockListings.filter((listing) => listing.trustScore >= 40) : mockListings

  const openModal = (score: number, riskLevel: "high" | "medium" | "low") => {
    setModalData({ isOpen: true, score, riskLevel })
  }

  const closeModal = () => {
    setModalData({ ...modalData, isOpen: false })
  }

  return (
    <div id="trust-shield-container" className="trust-shield-min-h-screen trust-shield-bg-gray-50">
      {/* Header */}
      <div className="trust-shield-bg-white trust-shield-border-b">
        <div className="trust-shield-max-w-7xl trust-shield-mx-auto trust-shield-px-4 trust-shield-py-4">
          <div className="trust-shield-flex trust-shield-items-center trust-shield-justify-between">
            <div className="trust-shield-flex trust-shield-items-center trust-shield-gap-4">
              <div className="trust-shield-text-green-600 trust-shield-font-bold trust-shield-text-xl">idealista</div>
              <nav className="trust-shield-hidden md:trust-shield-flex trust-shield-gap-6 trust-shield-text-sm">
                <a href="#" className="trust-shield-text-gray-600 hover:trust-shield-text-gray-900">
                  Owners
                </a>
                <a href="#" className="trust-shield-text-gray-600 hover:trust-shield-text-gray-900">
                  Find property
                </a>
                <a href="#" className="trust-shield-text-gray-600 hover:trust-shield-text-gray-900">
                  Mortgages
                </a>
              </nav>
            </div>
            <div className="trust-shield-flex trust-shield-items-center trust-shield-gap-2 md:trust-shield-gap-4">
              <Button
                variant="outline"
                size="sm"
                className="trust-shield-hidden md:trust-shield-inline-flex trust-shield-bg-transparent bg-transparent"
              >
                Add your listing for free
              </Button>
              <Button variant="ghost" size="sm" className="trust-shield-hidden md:trust-shield-inline-flex">
                Favourites
              </Button>
              <Button variant="ghost" size="sm" className="trust-shield-hidden md:trust-shield-inline-flex">
                Chat
              </Button>
              <Button variant="ghost" size="sm" className="md:trust-shield-hidden">
                Menu
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="trust-shield-max-w-7xl trust-shield-mx-auto trust-shield-px-4 trust-shield-py-6">
        <div className="trust-shield-flex trust-shield-flex-col lg:trust-shield-flex-row trust-shield-gap-6">
          {/* Sidebar Filters */}
          <div className="trust-shield-w-full lg:trust-shield-w-64 trust-shield-space-y-4">
            <div className="trust-shield-bg-white trust-shield-rounded-lg trust-shield-p-4 trust-shield-shadow-sm">
              <h3 className="trust-shield-font-semibold trust-shield-mb-3">Property type</h3>
              <div className="trust-shield-space-y-2 trust-shield-text-sm">
                <label className="trust-shield-flex trust-shield-items-center trust-shield-gap-2">
                  <input type="checkbox" className="trust-shield-rounded" defaultChecked />
                  Homes
                </label>
              </div>
            </div>

            <div className="trust-shield-bg-white trust-shield-rounded-lg trust-shield-p-4 trust-shield-shadow-sm">
              <h3 className="trust-shield-font-semibold trust-shield-mb-3">Price</h3>
              <div className="trust-shield-flex trust-shield-gap-2">
                <input
                  type="text"
                  placeholder="Min"
                  className="trust-shield-w-full trust-shield-px-2 trust-shield-py-1 trust-shield-border trust-shield-rounded trust-shield-text-sm"
                />
                <input
                  type="text"
                  placeholder="Max"
                  className="trust-shield-w-full trust-shield-px-2 trust-shield-py-1 trust-shield-border trust-shield-rounded trust-shield-text-sm"
                />
              </div>
            </div>

            {/* Trust Shield Filter */}
            <div className="trust-shield-bg-cream trust-shield-rounded-lg trust-shield-p-4 trust-shield-shadow-sm trust-shield-border trust-shield-border-charcoal-10">
              <div className="trust-shield-modal-background">
                <h3 className="trust-shield-font-semibold trust-shield-mb-3 trust-shield-text-charcoal trust-shield-font-rounded">
                  Trust Shield
                </h3>
                <div className="trust-shield-flex trust-shield-items-center trust-shield-gap-3">
                  <button
                    onClick={() => setHideUntrustworthy(!hideUntrustworthy)}
                    className="trust-shield-flex-shrink-0 focus:trust-shield-outline-none focus:trust-shield-ring-2 focus:trust-shield-ring-blue-500 trust-shield-rounded"
                    aria-label={`${hideUntrustworthy ? "Show" : "Hide"} listings with low trust scores`}
                  >
                    {hideUntrustworthy ? (
                      <ToggleRight className="trust-shield-w-6 trust-shield-h-6 trust-shield-text-sage-600" />
                    ) : (
                      <ToggleLeft className="trust-shield-w-6 trust-shield-h-6 trust-shield-text-charcoal-40" />
                    )}
                  </button>
                  <span className="trust-shield-text-sm trust-shield-text-charcoal trust-shield-font-rounded">
                    Hide listings with a score below 40
                  </span>
                </div>
              </div>
            </div>

            <div className="trust-shield-bg-white trust-shield-rounded-lg trust-shield-p-4 trust-shield-shadow-sm">
              <h3 className="trust-shield-font-semibold trust-shield-mb-3">Bedrooms</h3>
              <div className="trust-shield-space-y-2 trust-shield-text-sm">
                <label className="trust-shield-flex trust-shield-items-center trust-shield-gap-2">
                  <input type="checkbox" className="trust-shield-rounded" />1
                </label>
                <label className="trust-shield-flex trust-shield-items-center trust-shield-gap-2">
                  <input type="checkbox" className="trust-shield-rounded" />2
                </label>
                <label className="trust-shield-flex trust-shield-items-center trust-shield-gap-2">
                  <input type="checkbox" className="trust-shield-rounded" />3
                </label>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="trust-shield-flex-1">
            <div className="trust-shield-mb-6">
              <h1 className="trust-shield-text-xl md:trust-shield-text-2xl trust-shield-font-bold trust-shield-text-gray-900 trust-shield-mb-2">
                {filteredListings.length} houses and flats for rent in your drawn search area
              </h1>
              <div className="trust-shield-flex trust-shield-flex-col sm:trust-shield-flex-row trust-shield-items-start sm:trust-shield-items-center trust-shield-gap-4 trust-shield-text-sm">
                <Button size="sm" className="trust-shield-bg-pink-600 hover:trust-shield-bg-pink-700">
                  Save search
                </Button>
                <div className="trust-shield-flex trust-shield-flex-wrap trust-shield-gap-2">
                  <span className="trust-shield-text-gray-600">Sort by:</span>
                  <Button variant="ghost" size="sm" className="trust-shield-text-xs">
                    Relevance
                  </Button>
                  <Button variant="ghost" size="sm" className="trust-shield-text-xs">
                    Lowest price
                  </Button>
                  <Button variant="ghost" size="sm" className="trust-shield-text-xs">
                    Most recent
                  </Button>
                </div>
              </div>
            </div>

            {/* Property Listings */}
            <div className="trust-shield-space-y-4">
              {filteredListings.map((listing) => (
                <div
                  key={listing.id}
                  className="trust-shield-bg-white trust-shield-rounded-lg trust-shield-shadow-sm hover:trust-shield-shadow-md trust-shield-transition-shadow"
                >
                  <div className="trust-shield-flex trust-shield-flex-col sm:trust-shield-flex-row trust-shield-gap-4 trust-shield-p-4">
                    <div className="trust-shield-relative trust-shield-flex-shrink-0">
                      <img
                        src={listing.image || "/placeholder.svg"}
                        alt={listing.title}
                        className="trust-shield-w-full sm:trust-shield-w-48 trust-shield-h-32 trust-shield-object-cover trust-shield-rounded-lg"
                      />
                      <TrustBadgeV10
                        finalScore={listing.trustScore}
                        finalRiskLevel={listing.riskLevel}
                        delay={listing.loadingDelay}
                        onClick={() => openModal(listing.trustScore, listing.riskLevel)}
                      />
                      <div className="trust-shield-absolute trust-shield-bottom-2 trust-shield-right-2 trust-shield-bg-black-70 trust-shield-text-white trust-shield-text-xs trust-shield-px-2 trust-shield-py-1 trust-shield-rounded">
                        1/12
                      </div>
                    </div>

                    <div className="trust-shield-flex-1 trust-shield-min-w-0">
                      <h3 className="trust-shield-font-semibold trust-shield-text-blue-600 hover:trust-shield-text-blue-800 trust-shield-cursor-pointer trust-shield-mb-1 trust-shield-line-clamp-2 sm:trust-shield-truncate">
                        {listing.title}
                      </h3>
                      <div className="trust-shield-text-lg md:trust-shield-text-xl trust-shield-font-bold trust-shield-text-gray-900 trust-shield-mb-1">
                        {listing.price} €/month
                      </div>
                      <div className="trust-shield-text-sm trust-shield-text-gray-600 trust-shield-mb-2">
                        {listing.details}
                      </div>
                      <p className="trust-shield-text-sm trust-shield-text-gray-700 trust-shield-mb-3 trust-shield-line-clamp-2">
                        {listing.description}
                      </p>

                      <div className="trust-shield-flex trust-shield-items-center trust-shield-gap-3 trust-shield-flex-wrap">
                        <Button
                          size="sm"
                          variant="outline"
                          className="trust-shield-text-xs trust-shield-bg-transparent bg-transparent"
                        >
                          <MessageSquare className="trust-shield-w-3 trust-shield-h-3 trust-shield-mr-1" />
                          Contact
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="trust-shield-text-xs trust-shield-bg-transparent bg-transparent"
                        >
                          <Phone className="trust-shield-w-3 trust-shield-h-3 trust-shield-mr-1" />
                          View phone
                        </Button>
                        <Button size="sm" variant="ghost" className="trust-shield-text-xs trust-shield-p-1">
                          <Heart className="trust-shield-w-4 trust-shield-h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* V10 Trust Shield Modal */}
      <TrustShieldModalV10
        isOpen={modalData.isOpen}
        onClose={closeModal}
        score={modalData.score}
        riskLevel={modalData.riskLevel}
        isMobile={isMobile}
      />
    </div>
  )
}
