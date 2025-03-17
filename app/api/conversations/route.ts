import { NextRequest, NextResponse } from 'next/server';
import { getUserConversations, createConversation, ConversationServiceError } from '@/lib/conversation-service';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

// GET /api/conversations - Get all conversations
export async function GET(_: NextRequest) {
  try {
    console.log('GET /api/conversations - Processing request');
    
    // Check if this is a local conversation ID
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      console.log('GET /api/conversations - No authenticated user found');
      return NextResponse.json([], { status: 200 });
    }
    
    console.log(`GET /api/conversations - Fetching conversations for user: ${session.user.email}`);
    const conversations = await getUserConversations();
    console.log(`GET /api/conversations - Found ${conversations.length} conversations`);
    
    return NextResponse.json(conversations);
  } catch (error: any) {
    console.error('Error fetching conversations:', error);
    
    // Handle specific error types
    if (error instanceof ConversationServiceError) {
      const statusCode = error.code === 'UNAUTHENTICATED' ? 401 : 
                         error.code === 'USER_NOT_FOUND' ? 403 : 500;
      
      return NextResponse.json(
        { 
          error: error.message, 
          code: error.code 
        },
        { status: statusCode }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch conversations',
        message: error.message || 'Unknown error',
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
      },
      { status: 500 }
    );
  }
}

// POST /api/conversations - Create a new conversation
export async function POST(req: NextRequest) {
  try {
    console.log('POST /api/conversations - Processing request');
    
    // Parse request body
    let body;
    try {
      body = await req.json();
    } catch (e) {
      console.error('POST /api/conversations - Failed to parse request body:', e);
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }
    
    console.log('POST /api/conversations - Request body:', body);
    
    // Get the session
    let session;
    try {
      session = await getServerSession(authOptions);
    } catch (sessionError) {
      console.error('POST /api/conversations - Session retrieval error:', sessionError);
    }
    
    console.log('POST /api/conversations - Session obtained:', !!session?.user);
    
    if (!session?.user) {
      console.log('POST /api/conversations - No authenticated user, creating local conversation');
      
      // For non-authenticated users, return a mock conversation
      return NextResponse.json({
        id: `local-${Date.now()}`,
        title: body?.title || 'New conversation',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: []
      });
    }
    
    // Create conversation in database for authenticated users
    console.log(`POST /api/conversations - Creating conversation for user: ${session.user.email}`);
    const conversation = await createConversation(body?.title || 'New conversation');
    
    if (!conversation) {
      console.error('POST /api/conversations - Failed to create conversation, no error thrown');
      return NextResponse.json(
        { error: 'Failed to create conversation', code: 'CREATE_FAILED' },
        { status: 500 }
      );
    }
    
    console.log(`POST /api/conversations - Created conversation with ID: ${conversation.id}`);
    return NextResponse.json(conversation);
  } catch (error: any) {
    console.error('Error creating conversation:', error);
    
    // Handle specific error types
    if (error instanceof ConversationServiceError) {
      const statusCode = error.code === 'UNAUTHENTICATED' ? 401 : 
                         error.code === 'USER_NOT_FOUND' ? 403 :
                         error.code === 'INVALID_ID' ? 400 : 500;
      
      return NextResponse.json(
        { 
          error: error.message, 
          code: error.code 
        },
        { status: statusCode }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to create conversation',
        message: error.message || 'Unknown error',
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
      },
      { status: 500 }
    );
  }
} 