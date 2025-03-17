"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { SendHorizontal, Mic, Image, Paperclip } from "lucide-react"
import { cn } from "@/lib/utils"

interface ChatInputProps {
  onSendMessage: (message: string) => void
  isLoading: boolean
}

export function ChatInput({ onSendMessage, isLoading }: ChatInputProps) {
  const [message, setMessage] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`
    }
  }, [message])

  const handleSend = () => {
    if (message.trim() && !isLoading) {
      onSendMessage(message)
      setMessage("")

      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto"
      }
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="p-4 border-t sticky bottom-0 z-10 bg-background">
      <div className="max-w-3xl mx-auto">
        <div className="relative flex flex-col w-full bg-background border border-neutral-300 dark:border-neutral-600 rounded-xl shadow-sm">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message Marcus..."
            className={cn(
              "min-h-[56px] max-h-[200px] p-3 pr-12 resize-none border-0 rounded-xl",
              "focus-visible:ring-0 focus-visible:ring-transparent focus-visible:ring-offset-0",
            )}
            disabled={isLoading}
          />
          <div className="absolute right-2.5 bottom-2 flex gap-1.5 items-center">
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-7 w-7 rounded-md text-muted-foreground hover:text-foreground"
            >
              <Paperclip className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              onClick={handleSend}
              disabled={!message.trim() || isLoading}
              size="icon"
              className="h-7 w-7 bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200 rounded-md transition-colors"
            >
              <SendHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="text-xs text-center text-muted-foreground mt-2">
          Marcus AI can make mistakes. Consider checking important information.
        </div>
      </div>
    </div>
  )
}

