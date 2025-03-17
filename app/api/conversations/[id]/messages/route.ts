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
  const conversationId = params.id;
  console.log(`POST /api/conversations/${conversationId}/messages - Request received`);
  
  try {
    // Handle local conversations
    if (conversationId.startsWith('local-')) {
      console.log(`POST /api/conversations/${conversationId}/messages - Handling local conversation message`);
      
      let messageData;
      try {
        messageData = await req.json();
      } catch (parseError) {
        console.error(`POST /api/conversations/${conversationId}/messages - JSON parse error:`, parseError);
        return NextResponse.json(
          { error: 'Invalid JSON in request body' },
          { status: 400 }
        );
      }
      
      const { role, content, imageUrl, citations } = messageData;
      
      if (!role || !content) {
        console.log(`POST /api/conversations/${conversationId}/messages - Missing required fields - role: ${!!role}, content: ${!!content}`);
        return NextResponse.json(
          { error: 'Role and content are required' },
          { status: 400 }
        );
      }
      
      // For local conversations, just return the message data with a generated ID
      const mockMessage = {
        id: `local-msg-${Date.now()}`,
        conversationId,
        role,
        content,
        imageUrl,
        citations: citations || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      console.log(`POST /api/conversations/${conversationId}/messages - Created local message with ID: ${mockMessage.id}`);
      return NextResponse.json(mockMessage);
    }
    
    // Handle authenticated conversations
    let session;
    try {
      session = await getServerSession(authOptions);
    } catch (sessionError) {
      console.error(`POST /api/conversations/${conversationId}/messages - Session retrieval error:`, sessionError);
      return NextResponse.json(
        { error: 'Authentication service unavailable' },
        { status: 503 }
      );
    }
    
    if (!session?.user) {
      console.log(`POST /api/conversations/${conversationId}/messages - No authenticated user found`);
      
      // Instead of 401, return a more specific response for client-side handling
      return NextResponse.json({ 
        error: 'Unauthorized', 
        code: 'auth_required',
        message: 'You must be signed in to add messages to this conversation'
      }, { status: 401 });
    }
    
    console.log(`POST /api/conversations/${conversationId}/messages - Processing for user: ${session.user.email}`);
    
    let messageData;
    try {
      messageData = await req.json();
    } catch (parseError) {
      console.error(`POST /api/conversations/${conversationId}/messages - JSON parse error:`, parseError);
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }
    
    const { role, content, imageUrl, citations } = messageData;
    
    if (!role || !content) {
      console.log(`POST /api/conversations/${conversationId}/messages - Missing required fields - role: ${!!role}, content: ${!!content}`);
      return NextResponse.json(
        { error: 'Role and content are required' },
        { status: 400 }
      );
    }
    
    let message;
    try {
      message = await addMessageToConversation(conversationId, {
        role,
        content,
        imageUrl,
        citations,
      });
    } catch (dbError: any) {
      console.error(`POST /api/conversations/${conversationId}/messages - Database error:`, dbError);
      
      // Handle specific database errors
      if (dbError.code === 'P2025') {
        // Prisma error for record not found
        return NextResponse.json(
          { error: 'Conversation not found', code: 'not_found' },
          { status: 404 }
        );
      }
      
      if (dbError.code === 'P2003') {
        // Foreign key constraint failed
        return NextResponse.json(
          { error: 'Invalid conversation reference', code: 'invalid_reference' },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { error: 'Database error', details: dbError.message },
        { status: 500 }
      );
    }
    
    if (!message) {
      console.log(`POST /api/conversations/${conversationId}/messages - Failed to add message, no error thrown`);
      return NextResponse.json(
        { error: 'Failed to add message to conversation', code: 'operation_failed' },
        { status: 500 }
      );
    }
    
    console.log(`POST /api/conversations/${conversationId}/messages - Message added successfully with ID: ${message.id}`);
    return NextResponse.json(message);
  } catch (error: any) {
    console.error(`POST /api/conversations/${conversationId}/messages - Unhandled error:`, error);
    return NextResponse.json(
      { 
        error: 'An unexpected error occurred',
        message: error.message || 'Unknown error',
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
      },
      { status: 500 }
    );
  }
} 