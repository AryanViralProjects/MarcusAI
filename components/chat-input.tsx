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
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`
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
    <div className="p-4 border-t bg-card/80 backdrop-blur-sm sticky bottom-0 z-10">
      <div className="flex items-end gap-2 max-w-3xl mx-auto">
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Marcus anything..."
            className={cn(
              "min-h-[40px] max-h-[120px] py-3 pr-12 resize-none",
              "bg-background border-input focus-visible:ring-1 focus-visible:ring-ring",
            )}
            disabled={isLoading}
          />
          <div className="absolute right-3 bottom-3">
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 text-muted-foreground hover:text-foreground"
              type="button"
            >
              <Mic className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex gap-2">
          <Button size="icon" variant="outline" className="h-10 w-10 rounded-full" type="button">
            <Image className="h-4 w-4" aria-label="Upload image" />
          </Button>
          <Button size="icon" variant="outline" className="h-10 w-10 rounded-full" type="button">
            <Paperclip className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-600 to-blue-400 hover:from-blue-700 hover:to-blue-500"
            onClick={handleSend}
            disabled={!message.trim() || isLoading}
            type="button"
          >
            <SendHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="text-xs text-center text-muted-foreground mt-2">
        Messages are generated by AI and may be inaccurate or inappropriate.
        <span className="text-primary ml-1 hover:underline cursor-pointer">Learn more</span>
      </div>
    </div>
  )
}

