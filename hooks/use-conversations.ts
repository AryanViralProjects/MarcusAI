import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Conversation } from '@prisma/client';
import { ConversationWithMessages } from '@/lib/conversation-service';

export function useConversations() {
  const { data: session } = useSession();
  const [conversations, setConversations] = useState<ConversationWithMessages[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all conversations
  const fetchConversations = useCallback(async () => {
    if (!session?.user) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/conversations');
      
      if (!response.ok) {
        throw new Error('Failed to fetch conversations');
      }
      
      const data = await response.json();
      setConversations(data);
    } catch (err: any) {
      console.error('Error fetching conversations:', err);
      setError(err.message || 'Failed to fetch conversations');
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  // Create a new conversation
  const createConversation = useCallback(async (title?: string) => {
    if (!session?.user) return null;
    
    try {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create conversation');
      }
      
      const newConversation = await response.json();
      setConversations(prev => [newConversation, ...prev]);
      return newConversation;
    } catch (err: any) {
      console.error('Error creating conversation:', err);
      setError(err.message || 'Failed to create conversation');
      return null;
    }
  }, [session]);

  // Update a conversation
  const updateConversation = useCallback(async (id: string, data: { title?: string }) => {
    if (!session?.user) return null;
    
    try {
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
  }, [session]);

  // Delete a conversation
  const deleteConversation = useCallback(async (id: string) => {
    if (!session?.user) return false;
    
    try {
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
    if (!session?.user) return null;
    
    try {
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
  }, [session]);

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
    if (!session?.user) return null;
    
    try {
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
    if (session?.user) {
      fetchConversations();
    }
  }, [session, fetchConversations]);

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