"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { SendIcon, Sparkles, Menu, Paperclip, Mic, Search, Code, FileSearch } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Message, Conversation, Attachment } from "@/types/chat"
import { ToolType, sendMessage as apiSendMessage, Message as ApiMessage, ModelType } from "@/lib/openai"
import { saveConversations, loadConversations } from "@/lib/chat-service"
import { loadUserPreferences } from "@/lib/personalization"
import { UploadButton } from "@/components/upload-button"
import ReactMarkdown from "react-markdown"
import { SuggestionCards } from "@/components/suggestion-cards"
import { ModelSelector } from "@/components/model-selector"
import { ToolSelector } from "@/components/tool-selector"
import { useConversations } from "@/hooks/use-conversations"
import { useSession } from "next-auth/react"

const MODEL_OPTIONS = {
  GPT_4_5: "gpt-4.5-preview-2025-02-27",
  CLAUDE_3_7_SONNET: "claude-3-7-sonnet-20250219",
  GEMINI_2_0: "gemini-2.0-flash"
};

interface ChatInterfaceProps {
  className?: string
  currentConversationId: string
  onNewConversation: () => void
  onToggleSidebar: () => void
  isSidebarOpen: boolean
}

export function ChatInterface({
  className,
  currentConversationId,
  onNewConversation,
  onToggleSidebar,
  isSidebarOpen
}: ChatInterfaceProps) {
  // State
  const { data: session } = useSession()
  const { addMessageToConversation } = useConversations()
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [isMounted, setIsMounted] = useState(false)
  const [selectedModel, setSelectedModel] = useState<string>(MODEL_OPTIONS.GPT_4_5);
  const [selectedTools, setSelectedTools] = useState<ToolType[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation>({
    id: currentConversationId,
    title: "New conversation",
    messages: [],
  })
  
  // Debug initial state
  useEffect(() => {
    console.log("Initial model state:", selectedModel);
    console.log("Initial tools state:", selectedTools);
  }, []);

  // Refs
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const initialLoadRef = useRef(false)
  
  // Set isMounted to true after component mounts to prevent hydration issues
  useEffect(() => {
    setIsMounted(true)
  }, [])
  
  // Load conversations from local storage on initial render
  useEffect(() => {
    if (isMounted && !initialLoadRef.current) {
      initialLoadRef.current = true
      const loadedConversations = loadConversations()
      setConversations(loadedConversations)
      
      // Wrap in setTimeout to avoid setState during render error
      if (loadedConversations.length > 0) {
        setTimeout(() => {
          setConversations(loadedConversations)
        }, 0)
      }
    }
  }, [isMounted])
  
  // Update current conversation when conversations or currentConversationId changes
  useEffect(() => {
    const foundConversation = conversations.find(
      (conversation) => conversation.id === currentConversationId
    )
    
    if (foundConversation) {
      setCurrentConversation(foundConversation)
    } else if (currentConversation.id !== currentConversationId) {
      setCurrentConversation({
        id: currentConversationId,
        title: "New conversation",
        messages: [],
      })
    }
  }, [conversations, currentConversationId, currentConversation.id])
  
  // Scroll to bottom of chat when messages change
  useEffect(() => {
    if (isMounted && scrollAreaRef.current && currentConversation.messages.length > 0) {
      const scrollElement = scrollAreaRef.current
      setTimeout(() => {
        if (scrollElement) {
          scrollElement.scrollTop = scrollElement.scrollHeight
        }
      }, 100)
    }
  }, [isMounted, currentConversation.messages.length])

  // Update the conversation title based on the first user message
  const updateConversationTitle = useCallback((conversationId: string, message: string) => {
    setConversations((prevConversations) => {
      const updatedConversations = prevConversations.map((conversation) => {
        if (conversation.id === conversationId && conversation.title === "New conversation") {
          // Use the first ~25 characters of the message as the title
          const newTitle = message.length > 25 ? `${message.substring(0, 25)}...` : message
          return { ...conversation, title: newTitle }
        }
        return conversation
      })
      
      // Save the updated conversations to local storage
      saveConversations(updatedConversations)
      
      return updatedConversations
    })
  }, [])

  // Handle file upload completion
  const handleUploadComplete = useCallback((url: string, type: "image" | "document") => {
    const newAttachment: Attachment = {
      id: Date.now().toString(),
      url,
      type,
      name: url.split('/').pop() || 'file',
    }
    
    setAttachments((prev) => [...prev, newAttachment])
  }, [])

  // Handle model change with proper type safety for both string and enum inputs
  const handleModelChange = useCallback((modelId: string) => {
    console.log(`ChatInterface - Model change handler called with: ${modelId}`);
    // Store the selected model in localStorage to persist between sessions
    localStorage.setItem('selectedModel', modelId);
    setSelectedModel(modelId);
  }, []);

  // Handle tools change with proper type safety
  const handleToolsChange = useCallback((toolIds: ToolType[]) => {
    console.log(`ChatInterface - Tools change handler called with: ${toolIds}`);
    // Filter out any FILE_SEARCH or COMPUTER_USE tools as they're coming soon
    const availableTools = toolIds.filter(
      tool => tool !== ToolType.FILE_SEARCH && tool !== ToolType.COMPUTER_USE
    );
    setSelectedTools(availableTools);
  }, []);

  // Add effect to track model changes
  useEffect(() => {
    console.log(`ChatInterface - selectedModel changed to: ${selectedModel}`);
  }, [selectedModel]);

  // Load saved model from localStorage on initial render
  useEffect(() => {
    const savedModel = localStorage.getItem('selectedModel');
    if (savedModel) {
      console.log(`Loading saved model from localStorage: ${savedModel}`);
      setSelectedModel(savedModel);
    }
  }, []);

  // Define properly typed getAssistantResponse function
  const getAssistantResponse = useCallback(async (
    messages: Message[],
    model: string,
    tools: ToolType[]
  ): Promise<Message> => {
    try {
      // Default user preferences - basic object without strictly following UserPreferences type
      const userPreferences = {};
      
      // Call the sendMessage function from lib/openai.ts
      const apiResponse = await apiSendMessage(
        messages, 
        userPreferences, 
        model,
        tools.map(t => t.toString())
      );
      
      // Log the response for debugging
      console.log("API response:", apiResponse);
      
      // Convert ApiMessage to Message type for chat interface
      const message: Message = {
        id: apiResponse.id,
        role: apiResponse.role === 'assistant' ? 'assistant' : 'user',
        content: apiResponse.content,
        timestamp: apiResponse.timestamp,
        citations: apiResponse.citations
      };
      
      return message;
    } catch (error) {
      console.error('Error getting assistant response:', error);
      
      // Return an error message
      return {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'I apologize, but I encountered an error while processing your request. Please try again.',
        timestamp: new Date().toISOString(),
      };
    }
  }, []);

  // Handle sending a message
  const handleSendMessage = useCallback(async () => {
    if ((!input.trim() && attachments.length === 0) || isLoading) return
    
    // Log the current state before sending
    console.log("Sending message with tools:", selectedTools);
    console.log("Selected model:", selectedModel);
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date().toISOString(),
      attachments: attachments.length > 0 ? [...attachments] : undefined,
    }

    // Clear attachments after sending
    setAttachments([])

    // Update conversation with user message
    const updatedMessages = [...currentConversation.messages, userMessage]
    
    // Create updated conversation object
    const updatedConversation = {
      ...currentConversation,
      messages: updatedMessages,
    }
    
    // Update current conversation state
    setCurrentConversation(updatedConversation)

    // Update conversations state
    setConversations((prevConversations) => {
      const updatedConversations = prevConversations.map((conversation) =>
        conversation.id === currentConversationId ? updatedConversation : conversation
      )
      
      // If this conversation doesn't exist yet, add it
      if (!prevConversations.find((c) => c.id === currentConversationId)) {
        updatedConversations.push(updatedConversation)
      }
      
      saveConversations(updatedConversations)
      
      return updatedConversations
    })

    // Update the conversation title if it's the first message
    if (currentConversation.messages.length === 0) {
      updateConversationTitle(currentConversationId, input.trim())
    }

    // Clear input
    setInput("")
    
    // Focus the textarea
    if (textareaRef.current) {
      textareaRef.current.focus()
    }

    try {
      setIsLoading(true)
      
      // Get user preferences
      const userPreferences = loadUserPreferences()
      
      // Prepare API request
      const apiRequestBody = {
        messages: updatedMessages,
        preferences: userPreferences,
        model: selectedModel,
        tools: selectedTools,
        conversationId: session?.user ? currentConversationId : undefined
      };
      
      // Send the message to the API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiRequestBody),
      });
      
      if (!response.ok) {
        throw new Error('Failed to get response from API');
      }
      
      const apiResponse = await response.json();
      
      // Log the response for debugging
      console.log("API response:", apiResponse);
      console.log("Used model:", selectedModel);
      console.log("Used tools:", selectedTools);
      
      if (apiResponse) {
        // Create assistant message
        const assistantMessage: Message = {
          id: Date.now().toString(),
          role: "assistant",
          content: apiResponse.content || "I'm not sure how to respond to that.",
          timestamp: new Date().toISOString(),
          citations: apiResponse.citations // Include citations if available
        }

        // If the API created a new conversation, update the current conversation ID
        if (apiResponse.conversationId && apiResponse.conversationId !== currentConversationId) {
          // This is a new conversation created by the API
          onNewConversation();
        }

        // Update current conversation with assistant message
        setCurrentConversation(prev => ({
          ...prev,
          messages: [...prev.messages, assistantMessage]
        }))

        // Update conversation with assistant message
        setConversations((prevConversations) => {
          const updatedConversations = prevConversations.map((conversation) => {
            if (conversation.id === currentConversationId) {
              return {
                ...conversation,
                messages: [...conversation.messages, assistantMessage],
              }
            }
            return conversation
          })
          
          saveConversations(updatedConversations)
          
          return updatedConversations
        })
      }
    } catch (error) {
      console.error("Error sending message:", error)
      
      // Add error message
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: "Sorry, there was an error processing your request. Please try again.",
        timestamp: new Date().toISOString(),
      }

      // Update current conversation with error message
      setCurrentConversation(prev => ({
        ...prev,
        messages: [...prev.messages, errorMessage]
      }))

      setConversations((prevConversations) => {
        const updatedConversations = prevConversations.map((conversation) => {
          if (conversation.id === currentConversationId) {
            return {
              ...conversation,
              messages: [...conversation.messages, errorMessage],
            }
          }
          return conversation
        })
        
        saveConversations(updatedConversations)
        
        return updatedConversations
      })
    } finally {
      setIsLoading(false)
    }
  }, [input, attachments, isLoading, currentConversation, currentConversationId, updateConversationTitle, selectedModel, selectedTools, session, onNewConversation])

  // Handle textarea input including Enter key to send
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }, [handleSendMessage])

  // Render attachments preview
  const renderAttachmentsPreviews = () => {
    if (attachments.length === 0) return null;
    
    return (
      <div className="flex flex-wrap gap-2 mt-2">
        {attachments.map((attachment) => (
          <div key={attachment.id} className="relative group">
            {attachment.type === 'image' ? (
              <div className="w-16 h-16 rounded-md overflow-hidden border">
                <img 
                  src={attachment.url} 
                  alt="Attachment" 
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-md overflow-hidden border flex items-center justify-center bg-muted">
                <span className="text-xs text-center p-1 truncate">{attachment.name}</span>
              </div>
            )}
            <button
              className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => setAttachments(attachments.filter(a => a.id !== attachment.id))}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    );
  };

  // Render message attachments
  const renderMessageAttachments = (messageAttachments?: Attachment[]) => {
    if (!messageAttachments || messageAttachments.length === 0) return null;
    
    return (
      <div className="flex flex-wrap gap-2 mt-2">
        {messageAttachments.map((attachment) => (
          <div key={attachment.id} className="relative">
            {attachment.type === 'image' ? (
              <a href={attachment.url} target="_blank" rel="noopener noreferrer" className="block">
                <div className="max-w-xs rounded-md overflow-hidden border">
                  <img 
                    src={attachment.url} 
                    alt="Attachment" 
                    className="w-full h-auto object-cover"
                  />
                </div>
              </a>
            ) : (
              <a href={attachment.url} target="_blank" rel="noopener noreferrer" 
                 className="flex items-center gap-2 p-2 border rounded-md hover:bg-muted transition-colors">
                <span className="text-sm">{attachment.name}</span>
              </a>
            )}
          </div>
        ))}
      </div>
    );
  };

  // Render suggestion cards for empty conversation
  const renderSuggestionCards = useCallback(() => {
    const handleSuggestionClick = (suggestion: string) => {
      setInput(suggestion);
      // Use setTimeout to ensure this happens after the render cycle
      setTimeout(() => handleSendMessage(), 100);
    };

    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[calc(100vh-180px)]">
        <h1 className="text-3xl font-bold mb-8">Ask Marcus AI anything</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <div 
            className="bg-card hover:bg-card/80 border rounded-lg p-5 cursor-pointer transition-colors transform hover:scale-105 hover:shadow-lg"
            onClick={() => handleSuggestionClick("Help me write a professional email to request a meeting with a potential client")}
          >
            <div className="aspect-video rounded-lg overflow-hidden mb-5 bg-muted shadow-md">
              <img 
                src="/email-writing.png" 
                alt="Email writing" 
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = "/email-writing.png";
                }}
              />
            </div>
            <h3 className="font-medium text-center text-lg">Improve my email writing</h3>
          </div>
          <div 
            className="bg-card hover:bg-card/80 border rounded-lg p-5 cursor-pointer transition-colors transform hover:scale-105 hover:shadow-lg"
            onClick={() => handleSuggestionClick("Suggest some movies similar to Inception and Interstellar")}
          >
            <div className="aspect-video rounded-lg overflow-hidden mb-5 bg-muted shadow-md">
              <img 
                src="/movie-recommendation.png" 
                alt="Movie recommendations" 
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = "/movie-recommendation.png";
                }}
              />
            </div>
            <h3 className="font-medium text-center text-lg">Movie recommendations</h3>
          </div>
          <div 
            className="bg-card hover:bg-card/80 border rounded-lg p-5 cursor-pointer transition-colors transform hover:scale-105 hover:shadow-lg"
            onClick={() => handleSuggestionClick("Tell me about recent developments in space exploration and Mars missions")}
          >
            <div className="aspect-video rounded-lg overflow-hidden mb-5 bg-muted shadow-md">
              <img 
                src="/space-rocket.png" 
                alt="Space exploration" 
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = "/space-rocket.png";
                }}
              />
            </div>
            <h3 className="font-medium text-center text-lg">Let's Talk About Space</h3>
          </div>
        </div>
      </div>
    );
  }, [handleSendMessage, setInput]);

  // Don't render anything on the server to prevent hydration issues
  if (!isMounted) {
    return null;
  }

  return (
    <>
      {/* Add custom CSS for chat citations */}
      <style jsx global>{`
        .sources-section {
          margin-top: 1.5rem;
          padding-top: 1rem;
          border-top: 1px solid rgba(0, 0, 0, 0.1);
          max-width: 100%;
          overflow: hidden;
          background-color: rgba(0, 0, 0, 0.02);
          border-radius: 0.5rem;
          padding: 1rem;
          margin-top: 1.5rem;
        }
        
        .dark .sources-section {
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          background-color: rgba(255, 255, 255, 0.02);
        }
        
        .sources-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.75rem;
          font-size: 0.875rem;
          font-weight: 600;
          color: rgba(0, 0, 0, 0.5);
        }
        
        .dark .sources-header {
          color: rgba(255, 255, 255, 0.5);
        }
        
        .sources-header svg {
          color: rgba(0, 0, 0, 0.5);
        }
        
        .dark .sources-header svg {
          color: rgba(255, 255, 255, 0.5);
        }
        
        .citations-container {
          display: grid;
          gap: 0.5rem;
        }
        
        .citation {
          display: flex;
          flex-direction: column;
          padding: 0.5rem;
          border: 1px solid rgba(0, 0, 0, 0.1);
          border-radius: 0.375rem;
          transition: background-color 0.2s;
          background-color: white;
        }
        
        .citation:hover {
          background-color: rgba(0, 0, 0, 0.05);
        }
        
        .dark .citation {
          border-color: rgba(255, 255, 255, 0.1);
          background-color: rgba(30, 41, 59, 1);
        }
        
        .dark .citation:hover {
          background-color: rgba(255, 255, 255, 0.05);
        }
        
        .citation-link {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: inherit;
          text-decoration: none;
        }
        
        .citation-number {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          height: 1.25rem;
          width: 1.25rem;
          border-radius: 9999px;
          background-color: #f1f5f9;
          color: #1e293b;
          font-size: 0.75rem;
          font-weight: 500;
        }
        
        .dark .citation-number {
          background-color: #334155;
          color: #f8fafc;
        }
        
        .citation-title {
          font-weight: 500;
        }
        
        .citation-url {
          margin-top: 0.25rem;
          margin-left: 1.75rem;
          font-size: 0.75rem;
          color: rgba(0, 0, 0, 0.5);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        
        .dark .citation-url {
          color: rgba(255, 255, 255, 0.5);
        }
        
        /* Add styles for the superscript citation numbers in text */
        .prose sup a {
          color: inherit;
          text-decoration: none;
          font-weight: 500;
        }
        
        /* Make sure paragraph content is clean */
        .prose p {
          margin-bottom: 1rem;
          line-height: 1.6;
        }
      `}</style>

      {/* Model and tool selectors */}
      <div className="p-3 border-b">
        <div className="flex items-center gap-2">
          <ModelSelector 
            value={selectedModel} 
            onChange={handleModelChange} 
          />
          <ToolSelector 
            value={selectedTools} 
            onChange={handleToolsChange} 
          />
        </div>
      </div>

      {/* Chat messages */}
      <div className="flex-1 overflow-auto bg-background" ref={scrollAreaRef}>
        {currentConversation.messages.length === 0 ? (
          renderSuggestionCards()
        ) : (
          <div className="p-4 space-y-4">
            {currentConversation.messages.map((message) => (
              <div key={message.id} className="flex items-start gap-3">
                <Avatar className="h-8 w-8 mt-1">
                  {message.role === "user" ? (
                    <AvatarFallback className="bg-muted">U</AvatarFallback>
                  ) : (
                    <>
                      <AvatarImage src="/marcus-avatar.png" />
                      <AvatarFallback className="bg-gradient-to-br from-blue-600 to-blue-400 text-white">
                        M
                      </AvatarFallback>
                    </>
                  )}
                </Avatar>
                <div className="flex-1 overflow-hidden">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {message.role === "user" ? "You" : "Marcus AI"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Just now
                    </span>
                  </div>
                  <div className="mt-1 prose prose-sm max-w-none dark:prose-invert">
                    {message.role === "assistant" ? (
                      <>
                        {/* Check if the message contains HTML formatted sources section */}
                        {message.content.includes('<div class="sources-section">') ? (
                          <>
                            {/* Render the main content without the sources section */}
                            <div 
                              dangerouslySetInnerHTML={{ 
                                __html: message.content.split('<div class="sources-section">')[0].trim() 
                              }}
                            />
                            
                            {/* Render the sources section with dangerouslySetInnerHTML */}
                            <div 
                              dangerouslySetInnerHTML={{ 
                                __html: `<div class="sources-section">${message.content.split('<div class="sources-section">')[1]}` 
                              }} 
                            />
                          </>
                        ) : (
                          <div 
                            dangerouslySetInnerHTML={{ 
                              __html: message.content 
                            }} 
                          />
                        )}
                      </>
                    ) : (
                      <p>{message.content}</p>
                    )}
                  </div>
                  {renderMessageAttachments(message.attachments)}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex items-start gap-3">
                <Avatar className="h-8 w-8 mt-1">
                  <>
                    <AvatarImage src="/marcus-avatar.png" />
                    <AvatarFallback className="bg-gradient-to-br from-blue-600 to-blue-400 text-white">
                      M
                    </AvatarFallback>
                  </>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Marcus AI</span>
                    <span className="text-xs text-muted-foreground">
                      Just now
                    </span>
                  </div>
                  <div className="mt-1">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: "0ms" }} />
                      <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: "150ms" }} />
                      <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="border-t p-3">
        <div className="relative">
          {renderAttachmentsPreviews()}
          <div className="flex items-end border rounded-md overflow-hidden bg-background">
            <Textarea
              ref={textareaRef}
              placeholder="Ask Marcus AI anything..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="min-h-[60px] max-h-[200px] resize-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0 py-3 px-4"
            />
            <div className="flex p-2 gap-1">
              <UploadButton onUploadComplete={handleUploadComplete} />
              <Button 
                size="icon" 
                variant="ghost"
                className="rounded-full h-8 w-8 bg-blue-600 hover:bg-blue-700 text-white"
                onClick={handleSendMessage} 
                disabled={(!input.trim() && attachments.length === 0) || isLoading}
              >
                <SendIcon className="h-4 w-4" />
                <span className="sr-only">Send</span>
              </Button>
            </div>
          </div>
          <div className="text-xs text-center text-muted-foreground mt-2">
            Messages are generated by AI and may be inaccurate or inappropriate.
            <a href="#" className="ml-1 underline">Learn more</a>
          </div>
        </div>
      </div>
    </>
  )
}
