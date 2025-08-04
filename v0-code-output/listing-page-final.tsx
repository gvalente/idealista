"use client"

import TrustShieldCollapsedCached from "./trust-shield-collapsed-cached"
import TrustShieldInline from "./trust-shield-inline"
import TrustShieldModalFinal from "./trust-shield-modal-final"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Heart, Share, Phone, MessageSquare, MapPin, Calendar, Home, Zap } from "lucide-react"

export default function ListingPageFinal() {
  const [modalData, setModalData] = useState<{
    isOpen: boolean
    score: number
    riskLevel: "high" | "medium" | "low"
  }>({
    isOpen: false,
    score: 85,
    riskLevel: "high",
  })

  const openModal = (score: number, riskLevel: "high" | "medium" | "low") => {
    setModalData({ isOpen: true, score, riskLevel })
  }

  const closeModal = () => {
    setModalData({ ...modalData, isOpen: false })
  }

  // Simulate cached data from search results
  const cachedScore = 83 // Slightly different from final score to show update animation
  const cachedRiskLevel: "high" | "medium" | "low" = "high"

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
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Property Title & Price */}
            <div>
              <div className="flex items-start justify-between mb-2">
                <h1 className="text-2xl font-bold text-gray-900">
                  Flat / apartment for rent in La Dreta de l'Eixample
                </h1>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm">
                    <Heart className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Share className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center gap-4 mb-4">
                <div className="text-3xl font-bold text-gray-900">2,469 €/month</div>
                <div className="text-gray-600">Parking included</div>
              </div>
              <div className="flex items-center gap-6 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Home className="w-4 h-4" />4 bed, 119 m²
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  5th floor exterior with lift
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  17 hours
                </div>
              </div>
            </div>

            {/* Primary Trust Shield Placement - Collapsed with Caching */}
            <div className="w-full">
              <TrustShieldCollapsedCached
                score={85}
                riskLevel="high"
                cachedScore={cachedScore}
                cachedRiskLevel={cachedRiskLevel}
                onClick={() => openModal(85, "high")}
              />
            </div>

            {/* Hero Image */}
            <div className="relative">
              <img
                src="/placeholder.svg?height=400&width=800"
                alt="Property main image"
                className="w-full h-96 object-cover rounded-lg"
              />
              <div className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-1 rounded text-sm">
                See 31 more photos
              </div>
            </div>

            {/* Property Description */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h2 className="text-xl font-semibold mb-4">Property description</h2>
              <div className="prose text-gray-700">
                <p className="mb-4">
                  Magnificent apartment with parking next to Passeig de Gràcia. Magnificent modern, spacious, quiet and
                  bright apartment next to Paseo de Gràcia and very close to Plaza Cataluña.
                </p>
                <p className="mb-4">
                  It has 4 beautiful living rooms, four bedrooms (one of them en suite with wardrobe and two single
                  bedrooms with wardrobes, fully equipped kitchen and two complete bathrooms.
                </p>
                <p>
                  Air mattresses and linens are quality, complete air conditioning ducts, heat pump heating and parquet
                  floors.
                </p>
              </div>
            </div>

            {/* Basic Features */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h2 className="text-xl font-semibold mb-4">Basic features</h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div>• 119 m² built</div>
                  <div>• 4 bedrooms</div>
                  <div>• 2 bathrooms</div>
                  <div>• Parking space included in the price</div>
                  <div>• Second hand/good condition</div>
                </div>
                <div className="space-y-2">
                  <div>• Built in 2005</div>
                  <div>• Individual heating</div>
                  <div>• 5th floor exterior</div>
                  <div>• With lift</div>
                </div>
              </div>
            </div>

            {/* Amenities */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h2 className="text-xl font-semibold mb-4">Amenities</h2>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-green-600" />
                  Air conditioning
                </div>
                <div className="flex items-center gap-2">
                  <Home className="w-4 h-4 text-green-600" />
                  Furnished
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Card */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="text-center mb-4">
                <h3 className="font-semibold text-lg mb-2">Ask the advertiser</h3>
                <p className="text-sm text-gray-600">
                  Hi, I'm interested in this flat and would like to arrange a viewing.
                </p>
              </div>

              <div className="flex items-center gap-3 mb-4 p-3 bg-gray-50 rounded">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                  JM
                </div>
                <div>
                  <div className="font-medium">Joaquín</div>
                  <div className="text-xs text-gray-600">Professional advertiser</div>
                </div>
              </div>

              {/* Secondary Trust Shield Placement */}
              <div className="mb-4">
                <TrustShieldInline score={85} riskLevel="high" onClick={() => openModal(85, "high")} />
              </div>

              <div className="space-y-3">
                <Button className="w-full bg-pink-600 hover:bg-pink-700">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Contact via chat
                </Button>
                <Button variant="outline" className="w-full bg-transparent">
                  <Phone className="w-4 h-4 mr-2" />
                  View phone
                </Button>
              </div>

              <div className="mt-4 pt-4 border-t text-xs text-gray-500">
                <div>Listing reference</div>
                <div>6 months</div>
                <div>Page 6 Villarroel Barcelona</div>
              </div>
            </div>

            {/* Map placeholder */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="font-semibold mb-4">Location</h3>
              <div className="w-full h-48 bg-gray-200 rounded flex items-center justify-center text-gray-500">
                Map View
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Final Trust Shield Modal */}
      <TrustShieldModalFinal
        isOpen={modalData.isOpen}
        onClose={closeModal}
        score={modalData.score}
        riskLevel={modalData.riskLevel}
      />
    </div>
  )
}
