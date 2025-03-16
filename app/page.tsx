"use client";

import { useState, useCallback, useEffect } from "react";
import { ChatInterface } from "@/components/chat-interface";
import { Sidebar } from "@/components/sidebar";
import { useSession } from "next-auth/react";
import { useConversations } from "@/hooks/use-conversations";
import { v4 as uuidv4 } from "uuid";

export default function Home() {
  const { data: session } = useSession();
  const { createConversation } = useConversations();
  const [currentConversationId, setCurrentConversationId] = useState<string>("default");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);

  // Create a new conversation
  const handleNewConversation = useCallback(async () => {
    // Set loading state
    setIsCreatingConversation(true);
    
    // Immediately set a temporary ID to trigger UI update
    const tempId = uuidv4();
    setCurrentConversationId(tempId);
    
    try {
      if (session?.user) {
        // If user is authenticated, create a new conversation in the database
        const newConversation = await createConversation("New conversation");
        if (newConversation) {
          setCurrentConversationId(newConversation.id);
        }
      } else {
        // For non-authenticated users, we already set the ID above
        // No need to do anything else
      }
    } catch (error) {
      console.error("Error creating conversation:", error);
    } finally {
      setIsCreatingConversation(false);
    }
  }, [session, createConversation]);

  // Handle selecting a conversation
  const handleSelectConversation = useCallback((id: string) => {
    setCurrentConversationId(id);
  }, []);

  // Create a default conversation on first load if needed
  useEffect(() => {
    if (currentConversationId === "default") {
      handleNewConversation();
    }
  }, [currentConversationId, handleNewConversation]);

  return (
    <div className="flex h-screen bg-background">
      <Sidebar
        currentConversationId={currentConversationId}
        onSelectConversation={handleSelectConversation}
        onNewConversation={handleNewConversation}
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        isCreatingConversation={isCreatingConversation}
      />
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <ChatInterface 
          currentConversationId={currentConversationId}
          onNewConversation={handleNewConversation}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          isSidebarOpen={isSidebarOpen}
        />
      </main>
    </div>
  );
}
