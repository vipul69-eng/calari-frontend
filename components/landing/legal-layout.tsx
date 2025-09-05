import type React from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

interface LegalLayoutProps {
  title: string
  lastUpdated: string
  children: React.ReactNode
}

export default function LegalLayout({ title, lastUpdated, children }: LegalLayoutProps) {
  return (
    <div className="min-h-screen bg-white text-black">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <Link href="/">
            <Button variant="ghost" className="mb-4 p-0 h-auto font-normal hover:bg-gray-100">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to App
            </Button>
          </Link>
          <h1 className="text-3xl font-bold mb-2">{title}</h1>
          <p className="text-gray-600">Last updated: {lastUpdated}</p>
        </div>

        <div className="prose prose-lg max-w-none">{children}</div>
      </div>
    </div>
  )
}
