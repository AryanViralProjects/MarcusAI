"use client"

import type { Message } from "@/types/chat"
import { Avatar } from "@/components/ui/avatar"
import { AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Copy, ThumbsUp, ThumbsDown, MoreVertical } from "lucide-react"
import { formatDistanceToNow } from "@/lib/utils"
import { Sparkles, User } from "lucide-react"
import { useState } from "react"

interface ChatMessagesProps {
  messages: Message[]
  isLoading: boolean
}

export function ChatMessages({ messages, isLoading }: ChatMessagesProps) {
  const [hoveredMessage, setHoveredMessage] = useState<string | null>(null)

  return (
    <div className="divide-y divide-neutral-200 dark:divide-neutral-800 max-w-3xl mx-auto">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`py-6 px-4 group ${message.role === "assistant" ? "bg-white dark:bg-black" : "bg-neutral-50 dark:bg-neutral-900"}`}
          onMouseEnter={() => setHoveredMessage(message.id)}
          onMouseLeave={() => setHoveredMessage(null)}
        >
          <div className="flex items-start max-w-3xl mx-auto">
            <div className="mt-0.5 mr-4 flex-shrink-0">
              {message.role === "assistant" ? (
                <div className="h-6 w-6 rounded-full bg-green-600 flex items-center justify-center">
                  <Sparkles className="h-3.5 w-3.5 text-white" />
                </div>
              ) : (
                <div className="h-6 w-6 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center">
                  <User className="h-3.5 w-3.5 text-neutral-600 dark:text-neutral-300" />
                </div>
              )}
            </div>

            <div className="flex-1 space-y-2 overflow-hidden">
              <div className="flex items-center">
                <div className="font-medium text-sm">{message.role === "assistant" ? "Marcus" : "You"}</div>
              </div>

              <div className="prose prose-neutral dark:prose-invert prose-sm max-w-none">
                {typeof message.content === 'string' ? (
                  <div dangerouslySetInnerHTML={{ __html: message.content }} />
                ) : (
                  <p>{message.content}</p>
                )}
              </div>

              {message.role === "assistant" && hoveredMessage === message.id && (
                <div className="flex items-center pt-2 gap-2 text-neutral-500 dark:text-neutral-400">
                  <button className="inline-flex items-center text-xs gap-1.5 py-1 px-2 rounded-md hover:bg-neutral-200 dark:hover:bg-neutral-800">
                    <Copy className="h-3.5 w-3.5" />
                    Copy
                  </button>
                  <div className="flex items-center gap-0.5 ml-auto">
                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md hover:bg-neutral-200 dark:hover:bg-neutral-800">
                      <ThumbsUp className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md hover:bg-neutral-200 dark:hover:bg-neutral-800">
                      <ThumbsDown className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}

      {isLoading && (
        <div className="py-6 px-4 bg-white dark:bg-black">
          <div className="flex items-start max-w-3xl mx-auto">
            <div className="mt-0.5 mr-4 flex-shrink-0">
              <div className="h-6 w-6 rounded-full bg-green-600 flex items-center justify-center">
                <Sparkles className="h-3.5 w-3.5 text-white" />
              </div>
            </div>
            <div className="flex-1">
              <div className="font-medium text-sm">Marcus</div>
              <div className="h-6 mt-2 flex items-center">
                <div className="flex gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-neutral-400 dark:bg-neutral-500 animate-pulse"></div>
                  <div className="w-1.5 h-1.5 rounded-full bg-neutral-400 dark:bg-neutral-500 animate-pulse" style={{ animationDelay: "150ms" }}></div>
                  <div className="w-1.5 h-1.5 rounded-full bg-neutral-400 dark:bg-neutral-500 animate-pulse" style={{ animationDelay: "300ms" }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

