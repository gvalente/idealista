"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import SearchResultsV10 from "../search-results-v10"
import ListingPageV10 from "../listing-page-v10"

export default function HomePage() {
  const [currentView, setCurrentView] = useState<"home" | "search" | "listing">("home")

  if (currentView === "search") {
    return (
      <main>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-center mb-4">Trust Shield V10 - Final Production Version</h1>
          <p className="text-center text-gray-600 mb-8">
            Complete Chrome extension ready components with full accessibility and mobile support
          </p>
        </div>

        <div className="space-y-12">
          <section>
            <h2 className="text-2xl font-semibold mb-4">Search Results Page</h2>
            <SearchResultsV10 />
          </section>
        </div>
      </main>
    )
  }

  if (currentView === "listing") {
    return (
      <main>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-center mb-4">Trust Shield V10 - Final Production Version</h1>
          <p className="text-center text-gray-600 mb-8">
            Complete Chrome extension ready components with full accessibility and mobile support
          </p>
        </div>

        <div className="space-y-12">
          <section>
            <h2 className="text-2xl font-semibold mb-4">Listing Detail Page</h2>
            <ListingPageV10 />
          </section>
        </div>
      </main>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Idealista Trust Shield V10</h1>
          <p className="text-xl text-gray-600 mb-8">
            Production-ready Chrome extension with complete accessibility and mobile support
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setCurrentView("search")}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">🔍 Search Results Page</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                View the Trust Shield integrated into property search results with filtering capabilities.
              </p>
              <ul className="text-sm text-gray-500 space-y-1">
                <li>• 40px mobile tap targets</li>
                <li>• Trust score filtering</li>
                <li>• Responsive design</li>
                <li>• Loading animations</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setCurrentView("listing")}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">🏠 Property Listing Page</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                See the Trust Shield on individual property pages with detailed analysis.
              </p>
              <ul className="text-sm text-gray-500 space-y-1">
                <li>• Collapsed & inline variants</li>
                <li>• Mobile bottom sheet modal</li>
                <li>• Cached score updates</li>
                <li>• Full accessibility</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg">
          <h2 className="text-2xl font-semibold mb-4">V10 Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="font-semibold text-green-600 mb-2">🎯 Interactions</h3>
              <ul className="text-sm space-y-1">
                <li>• Full-row clickable accordions</li>
                <li>• Smooth height animations</li>
                <li>• Chevron rotation (down → up)</li>
                <li>• Modal state reset</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-blue-600 mb-2">📱 Mobile</h3>
              <ul className="text-sm space-y-1">
                <li>• 40px tap targets</li>
                <li>• Swipeable bottom sheet</li>
                <li>• Reduced top margin</li>
                <li>• Consistent styling</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-purple-600 mb-2">♿ Accessibility</h3>
              <ul className="text-sm space-y-1">
                <li>• WCAG 2.1 AA compliant</li>
                <li>• Full keyboard navigation</li>
                <li>• ARIA attributes</li>
                <li>• Focus indicators</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <p className="text-yellow-800 text-sm">
              <strong>Chrome Extension Ready:</strong> All styles are scoped with <code>trust-shield-</code> prefixes
              and contained within <code>#trust-shield-container</code> to prevent conflicts when injected into
              websites.
            </p>
          </div>
          <Button
            onClick={() => setCurrentView("search")}
            className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg"
          >
            Explore Trust Shield V10
          </Button>
        </div>
      </div>
    </div>
  )
}
