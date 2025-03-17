import { NextRequest, NextResponse } from 'next/server';
import { addMessageToConversation } from '@/lib/conversation-service';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

interface RouteParams {
  params: {
    id: string;
  };
}

// POST /api/conversations/[id]/messages - Add a message to a conversation
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    // Handle local conversations
    if (params.id.startsWith('local-')) {
      console.log(`POST /api/conversations/${params.id}/messages - Handling local conversation message`);
      
      const { role, content, imageUrl, citations } = await req.json();
      
      if (!role || !content) {
        return NextResponse.json(
          { error: 'Role and content are required' },
          { status: 400 }
        );
      }
      
      // For local conversations, just return the message data with a generated ID
      const mockMessage = {
        id: `local-msg-${Date.now()}`,
        conversationId: params.id,
        role,
        content,
        imageUrl,
        citations: citations || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      return NextResponse.json(mockMessage);
    }
    
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      console.log('POST /api/conversations/[id]/messages - No authenticated user found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    console.log(`POST /api/conversations/${params.id}/messages - Adding message for user: ${session.user.email}`);
    const { role, content, imageUrl, citations } = await req.json();
    
    if (!role || !content) {
      console.log('POST /api/conversations/[id]/messages - Missing role or content');
      return NextResponse.json(
        { error: 'Role and content are required' },
        { status: 400 }
      );
    }
    
    const message = await addMessageToConversation(params.id, {
      role,
      content,
      imageUrl,
      citations,
    });
    
    if (!message) {
      console.log(`POST /api/conversations/${params.id}/messages - Failed to add message`);
      return NextResponse.json(
        { error: 'Failed to add message to conversation' },
        { status: 500 }
      );
    }
    
    console.log(`POST /api/conversations/${params.id}/messages - Message added successfully`);
    return NextResponse.json(message);
  } catch (error: any) {
    console.error('Error adding message to conversation:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to add message to conversation' },
      { status: 500 }
    );
  }
} 