"use client"

import TrustShieldCard from "./trust-shield-card"

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      {/* Simulated Idealista page background */}
      <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          474 commercial properties for rent in your drawn search area
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Simulated property listings */}
          <div className="lg:col-span-2 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border rounded-lg p-4 bg-white">
                <div className="flex gap-4">
                  <div className="w-32 h-24 bg-gray-200 rounded flex items-center justify-center">
                    <span className="text-gray-500 text-sm">Property {i}</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-blue-600 mb-1">Commercial premises in Gràcia, Barcelona</h3>
                    <p className="text-lg font-bold text-gray-800">
                      {i === 1 ? "2,700" : i === 2 ? "24,003" : "1,500"} €/month
                    </p>
                    <p className="text-sm text-gray-600 mt-2">
                      Located on the main commercial axis of the Camp d'en Grassot i Gràcia Nova neighbourhood.
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Sidebar filters */}
          <div className="space-y-4">
            <div className="border rounded-lg p-4 bg-white">
              <h3 className="font-semibold mb-3">Property type</h3>
              <div className="space-y-2 text-sm">
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="rounded" />
                  Commercial premises
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="rounded" />
                  Industrial building
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Trust Shield Overlay */}
      <TrustShieldCard />
    </div>
  )
}
