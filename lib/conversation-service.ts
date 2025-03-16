import { prisma } from '@/lib/prisma';
import { Conversation, Message, Citation } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export type ConversationWithMessages = Conversation & {
  messages: (Message & {
    citations: Citation[];
  })[];
};

// Get all conversations for the current user
export async function getUserConversations(): Promise<ConversationWithMessages[]> {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    return [];
  }
  
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  
  if (!user) {
    return [];
  }
  
  return prisma.conversation.findMany({
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
}

// Get a single conversation by ID
export async function getConversation(id: string): Promise<ConversationWithMessages | null> {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    return null;
  }
  
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  
  if (!user) {
    return null;
  }
  
  return prisma.conversation.findFirst({
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
}

// Create a new conversation
export async function createConversation(title?: string): Promise<Conversation | null> {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    return null;
  }
  
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  
  if (!user) {
    return null;
  }
  
  return prisma.conversation.create({
    data: {
      title: title || 'New conversation',
      userId: user.id,
    },
  });
}

// Update a conversation
export async function updateConversation(id: string, data: { title?: string }): Promise<Conversation | null> {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    return null;
  }
  
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  
  if (!user) {
    return null;
  }
  
  return prisma.conversation.update({
    where: {
      id,
      userId: user.id,
    },
    data,
  });
}

// Delete a conversation
export async function deleteConversation(id: string): Promise<Conversation | null> {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    return null;
  }
  
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  
  if (!user) {
    return null;
  }
  
  return prisma.conversation.delete({
    where: {
      id,
      userId: user.id,
    },
  });
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
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    return null;
  }
  
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  
  if (!user) {
    return null;
  }
  
  // Check if the conversation belongs to the user
  const conversation = await prisma.conversation.findFirst({
    where: {
      id: conversationId,
      userId: user.id,
    },
  });
  
  if (!conversation) {
    return null;
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
  
  // Create citations if provided
  if (message.citations && message.citations.length > 0) {
    await prisma.citation.createMany({
      data: message.citations.map(citation => ({
        title: citation.title,
        url: citation.url,
        messageId: newMessage.id,
      })),
    });
  }
  
  // Update the conversation's updatedAt timestamp
  await prisma.conversation.update({
    where: { id: conversationId },
    data: { updatedAt: new Date() },
  });
  
  return newMessage;
} 