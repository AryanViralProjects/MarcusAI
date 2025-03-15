"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { Conversation } from "@/types/chat"
import { PenSquare, X, Save, History, Sparkles, Settings } from "lucide-react"
import { cn } from "@/lib/utils"
import { Avatar } from "@/components/ui/avatar"
import { AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { SettingsDialog } from "@/components/settings-dialog"

interface SidebarProps {
  conversations: Conversation[]
  currentConversationId: string
  onSelectConversation: (id: string) => void
  onNewConversation: () => void
  isOpen: boolean
  onToggle: () => void
}

export function Sidebar({
  conversations,
  currentConversationId,
  onSelectConversation,
  onNewConversation,
  isOpen,
  onToggle,
}: SidebarProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden" onClick={onToggle} />}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col w-72 border-r bg-card transition-transform duration-300 md:relative md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Logo and close button */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-blue-400">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold">Marcus</span>
          </div>
          <Button variant="ghost" size="icon" onClick={onToggle} className="md:hidden">
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* New conversation button */}
        <div className="p-4">
          <Button variant="outline" className="w-full justify-start gap-2" onClick={onNewConversation}>
            <PenSquare className="w-4 h-4" />
            New conversation
          </Button>
        </div>

        {/* Navigation */}
        <div className="px-4 py-2">
          <Button variant="ghost" className="w-full justify-start gap-2 mb-1">
            <Save className="w-4 h-4" />
            Saved
          </Button>
          <Button variant="ghost" className="w-full justify-start gap-2">
            <History className="w-4 h-4" />
            History
          </Button>
        </div>

        {/* Conversation list */}
        <ScrollArea className="flex-1 px-4 py-2">
          <div className="space-y-1">
            {conversations.map((conversation) => (
              <Button
                key={conversation.id}
                variant={conversation.id === currentConversationId ? "secondary" : "ghost"}
                className="w-full justify-start text-left truncate h-auto py-2"
                onClick={() => onSelectConversation(conversation.id)}
              >
                <span className="truncate">{conversation.title}</span>
              </Button>
            ))}
          </div>
        </ScrollArea>

        {/* User section */}
        <div className="p-4 border-t mt-auto">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src="/placeholder.svg?height=40&width=40" />
              <AvatarFallback>U</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">User</p>
              <p className="text-xs text-muted-foreground truncate">user@example.com</p>
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
