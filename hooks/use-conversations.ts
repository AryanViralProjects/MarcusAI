import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Conversation } from '@prisma/client';
import { ConversationWithMessages } from '@/lib/conversation-service';

// Define types for local messages and citations to match database schema
interface LocalMessage {
  id: string;
  conversationId: string;
  role: string;
  content: string;
  imageUrl: string | null;
  citations: LocalCitation[];
  createdAt: Date;
  updatedAt: Date;
}

interface LocalCitation {
  id: string;
  title: string | null;
  url: string;
  messageId: string;
}

// Helper to get local conversations from localStorage
const getLocalConversations = (): ConversationWithMessages[] => {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem('localConversations');
    const parsed = stored ? JSON.parse(stored) : [];
    
    // Convert string dates back to Date objects
    return parsed.map((conv: any) => ({
      ...conv,
      createdAt: new Date(conv.createdAt),
      updatedAt: new Date(conv.updatedAt),
      messages: (conv.messages || []).map((msg: any) => ({
        ...msg,
        createdAt: new Date(msg.createdAt),
        updatedAt: new Date(msg.updatedAt),
        imageUrl: msg.imageUrl || null,
        citations: (msg.citations || []).map((cit: any) => ({
          ...cit,
          title: cit.title || null
        }))
      }))
    }));
  } catch (e) {
    console.error('Error loading local conversations:', e);
    return [];
  }
};

// Helper to save local conversations to localStorage
const saveLocalConversations = (conversations: ConversationWithMessages[]) => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem('localConversations', JSON.stringify(conversations));
  } catch (e) {
    console.error('Error saving local conversations:', e);
  }
};

// Create a new local conversation
const createLocalConversation = (title?: string): ConversationWithMessages => {
  return {
    id: `local-${Date.now()}`,
    title: title || 'New conversation',
    createdAt: new Date(),
    updatedAt: new Date(),
    userId: 'local-user',
    messages: []
  };
};

// Create a new local message
const createLocalMessage = (
  conversationId: string,
  message: {
    role: string;
    content: string;
    imageUrl?: string;
    citations?: { title?: string; url: string }[];
  }
): LocalMessage => {
  return {
    id: `local-msg-${Date.now()}`,
    conversationId,
    role: message.role,
    content: message.content,
    imageUrl: message.imageUrl || null,
    citations: (message.citations || []).map(cit => ({
      id: `local-cit-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      title: cit.title || null,
      url: cit.url,
      messageId: `local-msg-${Date.now()}`
    })),
    createdAt: new Date(),
    updatedAt: new Date()
  };
};

export function useConversations() {
  const { data: session } = useSession();
  const [conversations, setConversations] = useState<ConversationWithMessages[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all conversations
  const fetchConversations = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    // If no session, use localStorage for conversations
    if (!session?.user) {
      console.log('No user session, using local conversations');
      const localConversations = getLocalConversations();
      setConversations(localConversations);
      setIsLoading(false);
      return;
    }
    
    try {
      console.log('Fetching conversations from API');
      const response = await fetch('/api/conversations');
      
      if (!response.ok) {
        throw new Error('Failed to fetch conversations');
      }
      
      const data = await response.json();
      setConversations(data);
    } catch (err: any) {
      console.error('Error fetching conversations:', err);
      setError(err.message || 'Failed to fetch conversations');
      // Fall back to local conversations on error
      const localConversations = getLocalConversations();
      setConversations(localConversations);
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  // Create a new conversation
  const createConversation = useCallback(async (title?: string) => {
    // If no session, create a local conversation
    if (!session?.user) {
      console.log('Creating local conversation');
      const newConversation = createLocalConversation(title);
      
      setConversations(prev => {
        const updated = [newConversation, ...prev];
        saveLocalConversations(updated);
        return updated;
      });
      
      return newConversation;
    }
    
    try {
      console.log(`Creating conversation via API with title: "${title}"`);
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title }),
      });
      
      if (!response.ok) {
        const responseText = await response.text();
        console.error(`Failed to create conversation. Status: ${response.status}. Response:`, responseText);
        throw new Error(`Failed to create conversation: ${response.status} ${responseText}`);
      }
      
      const newConversation = await response.json();
      console.log('Successfully created conversation:', newConversation.id);
      setConversations(prev => [newConversation, ...prev]);
      return newConversation;
    } catch (err: any) {
      console.error('Error creating conversation:', err);
      
      // If API fails, gracefully fall back to local conversation creation
      console.log('Falling back to local conversation due to API error');
      const localConversation = createLocalConversation(title);
      
      setConversations(prev => {
        const updated = [localConversation, ...prev];
        saveLocalConversations(updated);
        return updated;
      });
      
      return localConversation;
    }
  }, [session]);

  // Update a conversation
  const updateConversation = useCallback(async (id: string, data: { title?: string }) => {
    // If local conversation or no session
    if (id.startsWith('local-') || !session?.user) {
      console.log(`Updating local conversation: ${id}`);
      
      setConversations(prev => {
        const updated = prev.map(conv => {
          if (conv.id === id) {
            return {
              ...conv,
              title: data.title !== undefined ? data.title : conv.title,
              updatedAt: new Date()
            };
          }
          return conv;
        });
        saveLocalConversations(updated);
        return updated;
      });
      
      return conversations.find(c => c.id === id) || null;
    }
    
    try {
      console.log(`Updating conversation via API: ${id}`);
      const response = await fetch(`/api/conversations/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update conversation');
      }
      
      const updatedConversation = await response.json();
      setConversations(prev => 
        prev.map(conv => conv.id === id ? updatedConversation : conv)
      );
      return updatedConversation;
    } catch (err: any) {
      console.error('Error updating conversation:', err);
      setError(err.message || 'Failed to update conversation');
      return null;
    }
  }, [session, conversations]);

  // Delete a conversation
  const deleteConversation = useCallback(async (id: string) => {
    // If local conversation or no session
    if (id.startsWith('local-') || !session?.user) {
      console.log(`Deleting local conversation: ${id}`);
      setConversations(prev => {
        const updated = prev.filter(conv => conv.id !== id);
        saveLocalConversations(updated);
        return updated;
      });
      return true;
    }
    
    try {
      console.log(`Deleting conversation via API: ${id}`);
      const response = await fetch(`/api/conversations/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete conversation');
      }
      
      setConversations(prev => prev.filter(conv => conv.id !== id));
      return true;
    } catch (err: any) {
      console.error('Error deleting conversation:', err);
      setError(err.message || 'Failed to delete conversation');
      return false;
    }
  }, [session]);

  // Get a single conversation
  const getConversation = useCallback(async (id: string) => {
    // If local conversation or no session
    if (id.startsWith('local-') || !session?.user) {
      console.log(`Getting local conversation: ${id}`);
      return conversations.find(c => c.id === id) || null;
    }
    
    try {
      console.log(`Getting conversation via API: ${id}`);
      const response = await fetch(`/api/conversations/${id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch conversation');
      }
      
      return await response.json();
    } catch (err: any) {
      console.error('Error fetching conversation:', err);
      setError(err.message || 'Failed to fetch conversation');
      return null;
    }
  }, [session, conversations]);

  // Add a message to a conversation
  const addMessageToConversation = useCallback(async (
    conversationId: string,
    message: {
      role: string;
      content: string;
      imageUrl?: string;
      citations?: { title?: string; url: string }[];
    }
  ) => {
    // If local conversation or no session
    if (conversationId.startsWith('local-') || !session?.user) {
      console.log(`Adding message to local conversation: ${conversationId}`);
      const newMessage = createLocalMessage(conversationId, message);
      
      setConversations(prev => {
        const updated = prev.map(conv => {
          if (conv.id === conversationId) {
            return {
              ...conv,
              updatedAt: new Date(),
              messages: [...(conv.messages || []), newMessage]
            } as ConversationWithMessages;
          }
          return conv;
        });
        saveLocalConversations(updated);
        return updated;
      });
      
      return newMessage;
    }
    
    try {
      console.log(`Adding message to conversation via API: ${conversationId}`);
      const response = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });
      
      if (!response.ok) {
        throw new Error('Failed to add message to conversation');
      }
      
      const result = await response.json();
      
      // Refresh conversations after adding a message
      fetchConversations();
      
      return result;
    } catch (err: any) {
      console.error('Error adding message to conversation:', err);
      setError(err.message || 'Failed to add message to conversation');
      return null;
    }
  }, [session, fetchConversations]);

  // Fetch conversations on mount if user is authenticated
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  return {
    conversations,
    isLoading,
    error,
    fetchConversations,
    createConversation,
    updateConversation,
    deleteConversation,
    getConversation,
    addMessageToConversation,
  };
} 