export interface Attachment {
  id: string
  url: string
  type: "image" | "document"
  name: string
}

// Interface for citation objects from web search results
export interface Citation {
  type: string
  url: string
  title: string
  start_index: number
  end_index: number
}

export interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: string
  attachments?: Attachment[]
  citations?: Citation[] // Add citations for web search results
  imageUrl?: string // For backward compatibility with DB schema
}

export interface Conversation {
  id: string
  title: string
  messages: Message[]
}
