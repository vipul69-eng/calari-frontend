"use client"

import { Edit3, ChevronLeft, Mic, Notebook, EditIcon, MicOff } from "lucide-react"

export function CameraNavBar({
  onEditClick,
  onBackClick,
  onMicClick,
  isMicOff,
  disabled
}: {
  onEditClick: () => void
  onBackClick: () => void
  onMicClick: () => void
  isMicOff: boolean
disabled:boolean
}) {
  const handleScanClick = () => {
    console.log("Scan button clicked")
  }

  const handleBookmarkClick = () => {
    console.log("Bookmark button clicked")
  }

  return (
    <div className="bg-white/20 backdrop-blur-xl rounded-full shadow-2xl px-4 py-1 flex items-center gap-3 border border-white/30 max-w-sm mx-auto my-8 relative before:absolute before:inset-0 before:rounded-full before:bg-gradient-to-r before:from-white/10 before:to-transparent before:pointer-events-none">
      {/* Search Input */}
      

      {/* Action Buttons */}
      <div className="flex items-center gap-1 relative z-10">
        <button
          onClick={onBackClick}
          className="p-2 hover:bg-white/20 rounded-full transition-all duration-200 hover:shadow-lg hover:backdrop-blur-sm"
          aria-label="Scan"
        >
          <ChevronLeft className="w-5 h-5 text-gray-700 dark:text-gray-200" />
        </button>

        <button
          onClick={onMicClick}
          className="p-2 hover:bg-white/20 rounded-full transition-all duration-200 hover:shadow-lg hover:backdrop-blur-sm"
          aria-label="Bookmark"
          disabled={disabled}
        >
          {isMicOff?<MicOff className="w-5 h-5 text-gray-700 dark:text-gray-200" />:<Mic className="w-5 h-5 text-gray-700 dark:text-gray-200" />}
        </button>

        <button
          onClick={onEditClick}
          className="p-2 hover:bg-white/20 rounded-full transition-all duration-200 hover:shadow-lg hover:backdrop-blur-sm"
          aria-label="Edit"
        >
          <EditIcon className="w-5 h-5 text-gray-700 dark:text-gray-200" />
        </button>
      </div>
    </div>
  )
}
