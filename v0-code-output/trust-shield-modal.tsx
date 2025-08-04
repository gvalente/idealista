"use client"

import { X } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import TrustShieldExpanded from "./trust-shield-expanded"

interface TrustShieldModalProps {
  isOpen: boolean
  onClose: () => void
  score: number
  riskLevel: "high" | "medium" | "low"
}

export default function TrustShieldModal({ isOpen, onClose, score, riskLevel }: TrustShieldModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      {/* Modal Content */}
      <div className="relative z-10 max-w-md w-full mx-4">
        <Card className="bg-cream border-0 shadow-2xl">
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
          <CardContent className="pt-0">
            <TrustShieldExpanded score={score} riskLevel={riskLevel} />
          </CardContent>
        </Card>
      </div>

      <style jsx>{`
        .bg-cream {
          background-color: #faf8f3;
        }
        .text-charcoal {
          color: #4a4a4a;
        }
        .hover\\:bg-charcoal\\/10:hover {
          background-color: rgba(74, 74, 74, 0.1);
        }
      `}</style>
    </div>
  )
}
