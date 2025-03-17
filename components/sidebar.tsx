"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { X, Sparkles, Settings, Home } from "lucide-react"
import { cn } from "@/lib/utils"
import { SettingsDialog } from "@/components/settings-dialog"
import { SidebarAuth } from "@/components/auth/sidebar-auth"
import { ConversationList } from "@/components/conversation-list"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"

interface SidebarProps {
  currentConversationId: string
  onSelectConversation: (id: string) => void
  onNewConversation: () => void
  isOpen: boolean
  onToggle: () => void
  isCreatingConversation?: boolean
}

export function Sidebar({
  currentConversationId,
  onSelectConversation,
  onNewConversation,
  isOpen,
  onToggle,
  isCreatingConversation = false,
}: SidebarProps) {
  const { data: session } = useSession()
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const router = useRouter()

  // Function to handle logo click - both redirect to home and create a new conversation
  const handleLogoClick = () => {
    router.push('/');
    // Create a new conversation after a small delay to ensure routing completes
    setTimeout(() => {
      onNewConversation();
    }, 100);
  }

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden" onClick={onToggle} />}

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 flex flex-col w-72 border-r bg-card transition-transform duration-300 md:relative md:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full",
      )}>
        {/* Logo and navigation */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2 cursor-pointer" onClick={handleLogoClick}>
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-blue-400">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold">Marcus</span>
          </div>
          <Button variant="ghost" size="icon" onClick={onToggle} className="md:hidden">
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Navigation links */}
        <div className="flex items-center gap-4 px-4 py-2 border-b">
          <Button 
            variant="ghost" 
            className="flex items-center gap-2 text-sm h-8 px-2 w-full justify-start"
            onClick={handleLogoClick}
          >
            <Home className="h-4 w-4" />
            <span>Home</span>
          </Button>
        </div>

        {/* Conversation list */}
        <ScrollArea className="flex-1 px-4 py-4">
          <ConversationList 
            currentConversationId={currentConversationId}
            onSelectConversation={onSelectConversation}
            onNewConversation={onNewConversation}
            isCreatingConversation={isCreatingConversation}
          />
        </ScrollArea>

        {/* User section */}
        <div className="p-4 border-t mt-auto">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <SidebarAuth />
            </div>
            <Button variant="ghost" size="icon" onClick={() => setIsSettingsOpen(true)}>
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Settings Dialog */}
      <SettingsDialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen} />
    </>
  )
}
