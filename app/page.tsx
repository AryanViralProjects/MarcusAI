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
    console.log("Starting new conversation creation");
    
    // If already creating a conversation, don't start another one
    if (isCreatingConversation) {
      console.log("Already creating a conversation, ignoring request");
      return;
    }
    
    // Set loading state
    setIsCreatingConversation(true);
    
    // Generate a local ID for immediate UI update
    const localId = `local-${Date.now()}`;
    console.log(`Setting temporary conversation ID: ${localId}`);
    setCurrentConversationId(localId);
    
    try {
      // Create the conversation with our hook (which handles both local and API creation)
      console.log("Calling createConversation hook function");
      const newConversation = await createConversation("New conversation");
      
      if (newConversation) {
        console.log(`New conversation created successfully: ${newConversation.id}`);
        setCurrentConversationId(newConversation.id);
      } else {
        console.warn("createConversation returned null or undefined");
      }
    } catch (error) {
      console.error("Error in handleNewConversation:", error);
      // Keep the local ID we already set above
    } finally {
      setIsCreatingConversation(false);
    }
  }, [isCreatingConversation, createConversation]);

  // Handle selecting a conversation
  const handleSelectConversation = useCallback((id: string) => {
    console.log(`Selecting conversation: ${id}`);
    setCurrentConversationId(id);
  }, []);

  // Create a default conversation on first load if needed
  useEffect(() => {
    if (currentConversationId === "default") {
      console.log("Initial load - creating default conversation");
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
