"use client"

import { Button } from "@/components/ui/button"
import { Menu } from "lucide-react"

interface ChatHeaderProps {
  onToggleSidebar: () => void
  isSidebarOpen: boolean
}

export function ChatHeader({ onToggleSidebar, isSidebarOpen }: ChatHeaderProps) {
  return (
    <header className="flex items-center h-14 px-4 border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10">
      <Button variant="ghost" size="icon" onClick={onToggleSidebar} className={isSidebarOpen ? "md:hidden" : ""}>
        <Menu className="w-5 h-5" />
      </Button>
    </header>
  )
}

