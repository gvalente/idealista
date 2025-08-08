"use client"

import { useState, useEffect } from "react"
import TrustShieldCollapsedV10 from "./trust-shield-collapsed-v10"
import TrustShieldInlineV10 from "./trust-shield-inline-v10"
import TrustShieldModalV10 from "./trust-shield-modal-v10"
import { Button } from "@/components/ui/button"
import { Heart, Share, Phone, MessageSquare, MapPin, Calendar, Home, Zap } from "lucide-react"

export default function ListingPageV10() {
  const [isMobile, setIsMobile] = useState(false)
  const [modalData, setModalData] = useState<{
    isOpen: boolean
    score: number
    riskLevel: "high" | "medium" | "low"
  }>({
    isOpen: false,
    score: 85,
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
              <Button variant="ghost" size="sm" className="md:trust-shield-hidden">
                Menu
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="trust-shield-max-w-7xl trust-shield-mx-auto trust-shield-px-4 trust-shield-py-6">
        <div className="trust-shield-grid trust-shield-grid-cols-1 lg:trust-shield-grid-cols-3 trust-shield-gap-8">
          {/* Main Content */}
          <div className="lg:trust-shield-col-span-2 trust-shield-space-y-6">
            {/* Property Title & Price */}
            <div>
              <div className="trust-shield-flex trust-shield-flex-col sm:trust-shield-flex-row sm:trust-shield-items-start trust-shield-justify-between trust-shield-mb-2 trust-shield-gap-2">
                <h1 className="trust-shield-text-xl md:trust-shield-text-2xl trust-shield-font-bold trust-shield-text-gray-900">
                  Flat / apartment for rent in La Dreta de l'Eixample
                </h1>
                <div className="trust-shield-flex trust-shield-gap-2 trust-shield-flex-shrink-0">
                  <Button variant="ghost" size="sm">
                    <Heart className="trust-shield-w-4 trust-shield-h-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Share className="trust-shield-w-4 trust-shield-h-4" />
                  </Button>
                </div>
              </div>
              <div className="trust-shield-flex trust-shield-flex-col sm:trust-shield-flex-row sm:trust-shield-items-center trust-shield-gap-2 sm:trust-shield-gap-4 trust-shield-mb-4">
                <div className="trust-shield-text-2xl md:trust-shield-text-3xl trust-shield-font-bold trust-shield-text-gray-900">
                  2,469 €/month
                </div>
                <div className="trust-shield-text-gray-600">Parking included</div>
              </div>
              <div className="trust-shield-flex trust-shield-flex-wrap trust-shield-items-center trust-shield-gap-4 md:trust-shield-gap-6 trust-shield-text-sm trust-shield-text-gray-600">
                <div className="trust-shield-flex trust-shield-items-center trust-shield-gap-1">
                  <Home className="trust-shield-w-4 trust-shield-h-4" />4 bed, 119 m²
                </div>
                <div className="trust-shield-flex trust-shield-items-center trust-shield-gap-1">
                  <MapPin className="trust-shield-w-4 trust-shield-h-4" />
                  5th floor exterior with lift
                </div>
                <div className="trust-shield-flex trust-shield-items-center trust-shield-gap-1">
                  <Calendar className="trust-shield-w-4 trust-shield-h-4" />
                  17 hours
                </div>
              </div>
            </div>

            {/* Trust Shield Placement - Mobile: Static below price, Desktop: Collapsed */}
            <div className="trust-shield-w-full">
              <TrustShieldCollapsedV10
                score={85}
                riskLevel="high"
                cachedScore={cachedScore}
                cachedRiskLevel={cachedRiskLevel}
                onClick={() => openModal(85, "high")}
                isMobile={isMobile}
              />
            </div>

            {/* Hero Image */}
            <div className="trust-shield-relative">
              <img
                src="/placeholder.svg?height=400&width=800"
                alt="Property main image"
                className="trust-shield-w-full trust-shield-h-64 md:trust-shield-h-96 trust-shield-object-cover trust-shield-rounded-lg"
              />
              <div className="trust-shield-absolute trust-shield-bottom-4 trust-shield-right-4 trust-shield-bg-black-70 trust-shield-text-white trust-shield-px-3 trust-shield-py-1 trust-shield-rounded trust-shield-text-sm">
                See 31 more photos
              </div>
            </div>

            {/* Property Description */}
            <div className="trust-shield-bg-white trust-shield-rounded-lg trust-shield-p-4 md:trust-shield-p-6 trust-shield-shadow-sm">
              <h2 className="trust-shield-text-lg md:trust-shield-text-xl trust-shield-font-semibold trust-shield-mb-4">
                Property description
              </h2>
              <div className="trust-shield-prose trust-shield-text-gray-700">
                <p className="trust-shield-mb-4">
                  Magnificent apartment with parking next to Passeig de Gràcia. Magnificent modern, spacious, quiet and
                  bright apartment next to Paseo de Gràcia and very close to Plaza Cataluña.
                </p>
                <p className="trust-shield-mb-4">
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
            <div className="trust-shield-bg-white trust-shield-rounded-lg trust-shield-p-4 md:trust-shield-p-6 trust-shield-shadow-sm">
              <h2 className="trust-shield-text-lg md:trust-shield-text-xl trust-shield-font-semibold trust-shield-mb-4">
                Basic features
              </h2>
              <div className="trust-shield-grid trust-shield-grid-cols-1 md:trust-shield-grid-cols-2 trust-shield-gap-4 trust-shield-text-sm">
                <div className="trust-shield-space-y-2">
                  <div>• 119 m² built</div>
                  <div>• 4 bedrooms</div>
                  <div>• 2 bathrooms</div>
                  <div>• Parking space included in the price</div>
                  <div>• Second hand/good condition</div>
                </div>
                <div className="trust-shield-space-y-2">
                  <div>• Built in 2005</div>
                  <div>• Individual heating</div>
                  <div>• 5th floor exterior</div>
                  <div>• With lift</div>
                </div>
              </div>
            </div>

            {/* Amenities */}
            <div className="trust-shield-bg-white trust-shield-rounded-lg trust-shield-p-4 md:trust-shield-p-6 trust-shield-shadow-sm">
              <h2 className="trust-shield-text-lg md:trust-shield-text-xl trust-shield-font-semibold trust-shield-mb-4">
                Amenities
              </h2>
              <div className="trust-shield-grid trust-shield-grid-cols-1 md:trust-shield-grid-cols-2 trust-shield-gap-2 trust-shield-text-sm">
                <div className="trust-shield-flex trust-shield-items-center trust-shield-gap-2">
                  <Zap className="trust-shield-w-4 trust-shield-h-4 trust-shield-text-green-600" />
                  Air conditioning
                </div>
                <div className="trust-shield-flex trust-shield-items-center trust-shield-gap-2">
                  <Home className="trust-shield-w-4 trust-shield-h-4 trust-shield-text-green-600" />
                  Furnished
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="trust-shield-space-y-6">
            {/* Contact Card */}
            <div className="trust-shield-bg-white trust-shield-rounded-lg trust-shield-p-4 md:trust-shield-p-6 trust-shield-shadow-sm">
              <div className="trust-shield-text-center trust-shield-mb-4">
                <h3 className="trust-shield-font-semibold trust-shield-text-lg trust-shield-mb-2">
                  Ask the advertiser
                </h3>
                <p className="trust-shield-text-sm trust-shield-text-gray-600">
                  Hi, I'm interested in this flat and would like to arrange a viewing.
                </p>
              </div>

              <div className="trust-shield-flex trust-shield-items-center trust-shield-gap-3 trust-shield-mb-4 trust-shield-p-3 trust-shield-bg-gray-50 trust-shield-rounded">
                <div className="trust-shield-w-10 trust-shield-h-10 trust-shield-bg-blue-600 trust-shield-rounded-full trust-shield-flex trust-shield-items-center trust-shield-justify-center trust-shield-text-white trust-shield-font-semibold">
                  JM
                </div>
                <div>
                  <div className="trust-shield-font-medium">Joaquín</div>
                  <div className="trust-shield-text-xs trust-shield-text-gray-600">Professional advertiser</div>
                </div>
              </div>

              {/* Secondary Trust Shield Placement - Desktop only */}
              {!isMobile && (
                <div className="trust-shield-mb-4">
                  <TrustShieldInlineV10 score={85} riskLevel="high" onClick={() => openModal(85, "high")} />
                </div>
              )}

              <div className="trust-shield-space-y-3">
                <Button className="trust-shield-w-full trust-shield-bg-pink-600 hover:trust-shield-bg-pink-700 focus:trust-shield-outline-none focus:trust-shield-ring-2 focus:trust-shield-ring-blue-500">
                  <MessageSquare className="trust-shield-w-4 trust-shield-h-4 trust-shield-mr-2" />
                  Contact via chat
                </Button>
                <Button
                  variant="outline"
                  className="trust-shield-w-full trust-shield-bg-transparent focus:trust-shield-outline-none focus:trust-shield-ring-2 focus:trust-shield-ring-blue-500 bg-transparent"
                >
                  <Phone className="trust-shield-w-4 trust-shield-h-4 trust-shield-mr-2" />
                  View phone
                </Button>
              </div>

              <div className="trust-shield-mt-4 trust-shield-pt-4 trust-shield-border-t trust-shield-text-xs trust-shield-text-gray-500">
                <div>Listing reference</div>
                <div>6 months</div>
                <div>Page 6 Villarroel Barcelona</div>
              </div>
            </div>

            {/* Map placeholder */}
            <div className="trust-shield-bg-white trust-shield-rounded-lg trust-shield-p-4 md:trust-shield-p-6 trust-shield-shadow-sm">
              <h3 className="trust-shield-font-semibold trust-shield-mb-4">Location</h3>
              <div className="trust-shield-w-full trust-shield-h-48 trust-shield-bg-gray-200 trust-shield-rounded trust-shield-flex trust-shield-items-center trust-shield-justify-center trust-shield-text-gray-500">
                Map View
              </div>
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
