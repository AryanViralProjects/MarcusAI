"use client";

import { useState, useCallback } from "react";
import { ChatInterface } from "@/components/chat-interface";
import { Sidebar } from "@/components/sidebar";
import type { Conversation } from "@/types/chat";

export default function Home() {
  const [currentConversationId, setCurrentConversationId] = useState<string>("default");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Use useCallback to prevent recreating these functions on every render
  const handleNewConversation = useCallback(() => {
    const newId = Date.now().toString();
    setCurrentConversationId(newId);
  }, []);

  const handleUpdateConversations = useCallback((updatedConversations: Conversation[]) => {
    setConversations(updatedConversations);
  }, []);

  const handleSelectConversation = useCallback((id: string) => {
    setCurrentConversationId(id);
  }, []);

  return (
    <div className="flex h-screen bg-background">
      <Sidebar
        conversations={conversations}
        currentConversationId={currentConversationId}
        onSelectConversation={handleSelectConversation}
        onNewConversation={handleNewConversation}
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
      />
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <ChatInterface 
          currentConversationId={currentConversationId}
          onNewConversation={handleNewConversation}
          onUpdateConversations={handleUpdateConversations}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          isSidebarOpen={isSidebarOpen}
        />
      </main>
    </div>
  );
}
