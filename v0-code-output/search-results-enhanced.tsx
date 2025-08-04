"use client"

import { useState } from "react"
import TrustBadgeSmall from "./trust-badge-small"
import TrustShieldModal from "./trust-shield-modal"
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
  },
]

export default function SearchResultsEnhanced() {
  const [hideUntrustworthy, setHideUntrustworthy] = useState(false)
  const [modalData, setModalData] = useState<{
    isOpen: boolean
    score: number
    riskLevel: "high" | "medium" | "low"
  }>({
    isOpen: false,
    score: 0,
    riskLevel: "high",
  })

  const filteredListings = hideUntrustworthy ? mockListings.filter((listing) => listing.trustScore >= 40) : mockListings

  const openModal = (score: number, riskLevel: "high" | "medium" | "low") => {
    setModalData({ isOpen: true, score, riskLevel })
  }

  const closeModal = () => {
    setModalData({ ...modalData, isOpen: false })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-green-600 font-bold text-xl">idealista</div>
              <nav className="flex gap-6 text-sm">
                <a href="#" className="text-gray-600 hover:text-gray-900">
                  Owners
                </a>
                <a href="#" className="text-gray-600 hover:text-gray-900">
                  Find property
                </a>
                <a href="#" className="text-gray-600 hover:text-gray-900">
                  Mortgages
                </a>
              </nav>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm">
                Add your listing for free
              </Button>
              <Button variant="ghost" size="sm">
                Favourites
              </Button>
              <Button variant="ghost" size="sm">
                Chat
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Sidebar Filters */}
          <div className="w-64 space-y-4">
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h3 className="font-semibold mb-3">Property type</h3>
              <div className="space-y-2 text-sm">
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="rounded" defaultChecked />
                  Homes
                </label>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h3 className="font-semibold mb-3">Price</h3>
              <div className="flex gap-2">
                <input type="text" placeholder="Min" className="w-full px-2 py-1 border rounded text-sm" />
                <input type="text" placeholder="Max" className="w-full px-2 py-1 border rounded text-sm" />
              </div>
            </div>

            {/* Trust Shield Filter */}
            <div className="bg-cream rounded-lg p-4 shadow-sm border border-charcoal/10">
              <h3 className="font-semibold mb-3 text-charcoal font-rounded">Trust Shield</h3>
              <div className="flex items-center gap-3">
                <button onClick={() => setHideUntrustworthy(!hideUntrustworthy)} className="flex-shrink-0">
                  {hideUntrustworthy ? (
                    <ToggleRight className="w-6 h-6 text-sage-600" />
                  ) : (
                    <ToggleLeft className="w-6 h-6 text-charcoal/40" />
                  )}
                </button>
                <span className="text-sm text-charcoal font-rounded">Hide listings with a score below 40</span>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h3 className="font-semibold mb-3">Bedrooms</h3>
              <div className="space-y-2 text-sm">
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="rounded" />1
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="rounded" />2
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="rounded" />3
                </label>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {filteredListings.length} houses and flats for rent in your drawn search area
              </h1>
              <div className="flex items-center gap-4 text-sm">
                <Button size="sm" className="bg-pink-600 hover:bg-pink-700">
                  Save search
                </Button>
                <div className="flex gap-2">
                  <span className="text-gray-600">Sort by:</span>
                  <Button variant="ghost" size="sm" className="text-xs">
                    Relevance
                  </Button>
                  <Button variant="ghost" size="sm" className="text-xs">
                    Lowest price
                  </Button>
                  <Button variant="ghost" size="sm" className="text-xs">
                    Most recent
                  </Button>
                </div>
              </div>
            </div>

            {/* Property Listings */}
            <div className="space-y-4">
              {filteredListings.map((listing) => (
                <div key={listing.id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex gap-4 p-4">
                    <div className="relative flex-shrink-0">
                      <img
                        src={listing.image || "/placeholder.svg"}
                        alt={listing.title}
                        className="w-48 h-32 object-cover rounded-lg"
                      />
                      <TrustBadgeSmall
                        score={listing.trustScore}
                        riskLevel={listing.riskLevel}
                        onClick={() => openModal(listing.trustScore, listing.riskLevel)}
                      />
                      <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                        1/12
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-blue-600 hover:text-blue-800 cursor-pointer mb-1 truncate">
                        {listing.title}
                      </h3>
                      <div className="text-xl font-bold text-gray-900 mb-1">{listing.price} €/month</div>
                      <div className="text-sm text-gray-600 mb-2">{listing.details}</div>
                      <p className="text-sm text-gray-700 mb-3 line-clamp-2">{listing.description}</p>

                      <div className="flex items-center gap-3">
                        <Button size="sm" variant="outline" className="text-xs bg-transparent">
                          <MessageSquare className="w-3 h-3 mr-1" />
                          Contact
                        </Button>
                        <Button size="sm" variant="outline" className="text-xs bg-transparent">
                          <Phone className="w-3 h-3 mr-1" />
                          View phone
                        </Button>
                        <Button size="sm" variant="ghost" className="text-xs p-1">
                          <Heart className="w-4 h-4" />
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

      {/* Trust Shield Modal */}
      <TrustShieldModal
        isOpen={modalData.isOpen}
        onClose={closeModal}
        score={modalData.score}
        riskLevel={modalData.riskLevel}
      />

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
        .border-charcoal\\/10 {
          border-color: rgba(74, 74, 74, 0.1);
        }
        .font-rounded {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          font-feature-settings: 'cv02', 'cv03', 'cv04', 'cv11';
        }
      `}</style>
    </div>
  )
}
