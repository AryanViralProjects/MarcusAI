import { prisma } from '@/lib/prisma';
import { Conversation, Message, Citation } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export type ConversationWithMessages = Conversation & {
  messages: (Message & {
    citations: Citation[];
  })[];
};

/**
 * Custom error class for conversation service errors
 */
export class ConversationServiceError extends Error {
  code: string;
  
  constructor(message: string, code: string) {
    super(message);
    this.name = 'ConversationServiceError';
    this.code = code;
  }
}

/**
 * Validates user authentication and returns the user
 * @throws ConversationServiceError if user is not authenticated
 */
async function getAuthenticatedUser() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    throw new ConversationServiceError('User not authenticated', 'UNAUTHENTICATED');
  }
  
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  
  if (!user) {
    throw new ConversationServiceError('User not found in database', 'USER_NOT_FOUND');
  }
  
  return user;
}

// Get all conversations for the current user
export async function getUserConversations(): Promise<ConversationWithMessages[]> {
  try {
    const user = await getAuthenticatedUser();
    
    console.log(`Fetching conversations for user: ${user.id}`);
    
    const conversations = await prisma.conversation.findMany({
      where: { userId: user.id },
      include: {
        messages: {
          include: {
            citations: true,
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });
    
    console.log(`Found ${conversations.length} conversations for user: ${user.id}`);
    return conversations;
  } catch (error) {
    if (error instanceof ConversationServiceError) {
      // Re-throw custom errors
      throw error;
    }
    
    console.error('Error fetching user conversations:', error);
    throw new ConversationServiceError(
      'Failed to fetch conversations', 
      'FETCH_FAILED'
    );
  }
}

// Get a single conversation by ID
export async function getConversation(id: string): Promise<ConversationWithMessages | null> {
  try {
    if (!id) {
      throw new ConversationServiceError('Conversation ID is required', 'INVALID_ID');
    }
    
    const user = await getAuthenticatedUser();
    
    console.log(`Fetching conversation ${id} for user: ${user.id}`);
    
    const conversation = await prisma.conversation.findFirst({
      where: {
        id,
        userId: user.id,
      },
      include: {
        messages: {
          include: {
            citations: true,
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });
    
    if (!conversation) {
      console.log(`Conversation ${id} not found for user: ${user.id}`);
      return null;
    }
    
    console.log(`Found conversation ${id} with ${conversation.messages.length} messages`);
    return conversation;
  } catch (error) {
    if (error instanceof ConversationServiceError) {
      throw error;
    }
    
    console.error(`Error fetching conversation ${id}:`, error);
    throw new ConversationServiceError(
      'Failed to fetch conversation', 
      'FETCH_FAILED'
    );
  }
}

// Create a new conversation
export async function createConversation(title?: string): Promise<Conversation | null> {
  try {
    const user = await getAuthenticatedUser();
    
    const finalTitle = title || 'New conversation';
    console.log(`Creating new conversation "${finalTitle}" for user: ${user.id}`);
    
    const conversation = await prisma.conversation.create({
      data: {
        title: finalTitle,
        userId: user.id,
      },
    });
    
    console.log(`Created new conversation with ID: ${conversation.id}`);
    return conversation;
  } catch (error) {
    if (error instanceof ConversationServiceError) {
      throw error;
    }
    
    console.error('Error creating conversation:', error);
    throw new ConversationServiceError(
      'Failed to create conversation', 
      'CREATE_FAILED'
    );
  }
}

// Update a conversation
export async function updateConversation(id: string, data: { title?: string }): Promise<Conversation | null> {
  try {
    if (!id) {
      throw new ConversationServiceError('Conversation ID is required', 'INVALID_ID');
    }
    
    const user = await getAuthenticatedUser();
    
    console.log(`Updating conversation ${id} for user: ${user.id}`);
    
    // Check if the conversation exists and belongs to the user
    const existing = await prisma.conversation.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });
    
    if (!existing) {
      console.log(`Conversation ${id} not found or doesn't belong to user: ${user.id}`);
      return null;
    }
    
    const conversation = await prisma.conversation.update({
      where: {
        id,
      },
      data,
    });
    
    console.log(`Updated conversation ${id} successfully`);
    return conversation;
  } catch (error) {
    if (error instanceof ConversationServiceError) {
      throw error;
    }
    
    console.error(`Error updating conversation ${id}:`, error);
    throw new ConversationServiceError(
      'Failed to update conversation', 
      'UPDATE_FAILED'
    );
  }
}

// Delete a conversation
export async function deleteConversation(id: string): Promise<Conversation | null> {
  try {
    if (!id) {
      throw new ConversationServiceError('Conversation ID is required', 'INVALID_ID');
    }
    
    const user = await getAuthenticatedUser();
    
    console.log(`Deleting conversation ${id} for user: ${user.id}`);
    
    // Check if the conversation exists and belongs to the user
    const existing = await prisma.conversation.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });
    
    if (!existing) {
      console.log(`Conversation ${id} not found or doesn't belong to user: ${user.id}`);
      return null;
    }
    
    const conversation = await prisma.conversation.delete({
      where: {
        id,
      },
    });
    
    console.log(`Deleted conversation ${id} successfully`);
    return conversation;
  } catch (error) {
    if (error instanceof ConversationServiceError) {
      throw error;
    }
    
    console.error(`Error deleting conversation ${id}:`, error);
    throw new ConversationServiceError(
      'Failed to delete conversation', 
      'DELETE_FAILED'
    );
  }
}

// Add a message to a conversation
export async function addMessageToConversation(
  conversationId: string,
  message: {
    role: string;
    content: string;
    imageUrl?: string;
    citations?: { title?: string; url: string }[];
  }
): Promise<Message | null> {
  try {
    if (!conversationId) {
      throw new ConversationServiceError('Conversation ID is required', 'INVALID_ID');
    }
    
    if (!message.role || !message.content) {
      throw new ConversationServiceError('Message role and content are required', 'INVALID_MESSAGE');
    }
    
    const user = await getAuthenticatedUser();
    
    console.log(`Adding message to conversation ${conversationId} for user: ${user.id}`);
    
    // Check if the conversation belongs to the user
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        userId: user.id,
      },
    });
    
    if (!conversation) {
      console.log(`Conversation ${conversationId} not found or doesn't belong to user: ${user.id}`);
      throw new ConversationServiceError('Conversation not found or access denied', 'CONVERSATION_NOT_FOUND');
    }
    
    // Create the message
    const newMessage = await prisma.message.create({
      data: {
        role: message.role,
        content: message.content,
        imageUrl: message.imageUrl,
        conversationId,
      },
    });
    
    console.log(`Created message ${newMessage.id} in conversation ${conversationId}`);
    
    // Create citations if provided
    if (message.citations && message.citations.length > 0) {
      try {
        await prisma.citation.createMany({
          data: message.citations.map(citation => ({
            title: citation.title,
            url: citation.url,
            messageId: newMessage.id,
          })),
        });
        console.log(`Added ${message.citations.length} citations to message ${newMessage.id}`);
      } catch (citationError) {
        console.error(`Error creating citations for message ${newMessage.id}:`, citationError);
        // Continue even if citations fail - the message itself was created
      }
    }
    
    // Update the conversation's updatedAt timestamp
    try {
      await prisma.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      });
    } catch (updateError) {
      console.error(`Error updating conversation timestamp for ${conversationId}:`, updateError);
      // Continue even if timestamp update fails - the message itself was created
    }
    
    return newMessage;
  } catch (error) {
    if (error instanceof ConversationServiceError) {
      throw error;
    }
    
    console.error(`Error adding message to conversation ${conversationId}:`, error);
    throw new ConversationServiceError(
      'Failed to add message to conversation', 
      'ADD_MESSAGE_FAILED'
    );
  }
}