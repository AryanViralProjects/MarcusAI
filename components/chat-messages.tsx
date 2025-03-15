"use client"

import type { Message } from "@/types/chat"
import { Avatar } from "@/components/ui/avatar"
import { AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Copy, ThumbsUp, ThumbsDown, MoreVertical } from "lucide-react"
import { formatDistanceToNow } from "@/lib/utils"
import { Sparkles } from "lucide-react"

interface ChatMessagesProps {
  messages: Message[]
  isLoading: boolean
}

export function ChatMessages({ messages, isLoading }: ChatMessagesProps) {
  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {messages.map((message) => (
        <div key={message.id} className="flex gap-4 items-start">
          <Avatar
            className={message.role === "assistant" ? "bg-gradient-to-br from-blue-600 to-blue-400" : "bg-secondary"}
          >
            {message.role === "assistant" ? (
              <>
                <AvatarFallback>
                  <Sparkles className="h-4 w-4 text-white" />
                </AvatarFallback>
                <AvatarImage src="/placeholder.svg?height=40&width=40" />
              </>
            ) : (
              <>
                <AvatarFallback>U</AvatarFallback>
                <AvatarImage src="/placeholder.svg?height=40&width=40" />
              </>
            )}
          </Avatar>

          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-medium">{message.role === "assistant" ? "Marcus" : "You"}</span>
              <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(message.timestamp))}</span>
            </div>

            <div className="prose prose-sm dark:prose-invert max-w-none">{message.content}</div>

            {message.role === "assistant" && (
              <div className="flex items-center gap-1 pt-1">
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                  <ThumbsUp className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                  <ThumbsDown className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                  <Copy className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      ))}

      {isLoading && (
        <div className="flex gap-4 items-start">
          <Avatar className="bg-gradient-to-br from-blue-500 to-purple-600">
            <AvatarFallback>
              <Sparkles className="h-4 w-4 text-white" />
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium">Marcus</span>
              <span className="text-xs text-muted-foreground">Just now</span>
            </div>
            <div className="h-6 mt-2 flex items-center">
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }}></div>
                <div
                  className="w-2 h-2 rounded-full bg-primary animate-bounce"
                  style={{ animationDelay: "150ms" }}
                ></div>
                <div
                  className="w-2 h-2 rounded-full bg-primary animate-bounce"
                  style={{ animationDelay: "300ms" }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

