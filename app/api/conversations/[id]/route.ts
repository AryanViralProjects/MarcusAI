import { NextRequest, NextResponse } from 'next/server';
import { getConversation, updateConversation, deleteConversation, ConversationServiceError } from '@/lib/conversation-service';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/conversations/[id] - Get a specific conversation
export async function GET(_: NextRequest, { params }: RouteParams) {
  const conversationId = params.id;
  console.log(`GET /api/conversations/${conversationId} - Request received`);
  
  try {
    // Check if this is a local conversation ID
    if (conversationId.startsWith('local-')) {
      console.log(`GET /api/conversations/${conversationId} - Handling local conversation`);
      // Return an empty conversation structure for local conversations
      return NextResponse.json({
        id: conversationId,
        title: 'New conversation',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: []
      });
    }
    
    let session;
    try {
      session = await getServerSession(authOptions);
    } catch (sessionError) {
      console.error(`GET /api/conversations/${conversationId} - Session retrieval error:`, sessionError);
      return NextResponse.json(
        { error: 'Authentication service unavailable' },
        { status: 503 }
      );
    }
    
    if (!session?.user) {
      console.log(`GET /api/conversations/${conversationId} - No authenticated user found`);
      return NextResponse.json({ 
        error: 'Unauthorized',
        code: 'auth_required',
        message: 'You must be signed in to access this conversation'
      }, { status: 401 });
    }
    
    console.log(`GET /api/conversations/${conversationId} - Fetching for user: ${session.user.email}`);
    
    const conversation = await getConversation(conversationId);
    
    if (!conversation) {
      console.log(`GET /api/conversations/${conversationId} - Conversation not found`);
      return NextResponse.json({ 
        error: 'Conversation not found',
        code: 'not_found'
      }, { status: 404 });
    }
    
    return NextResponse.json(conversation);
  } catch (error: any) {
    console.error(`GET /api/conversations/${conversationId} - Error:`, error);
    
    // Handle specific error types
    if (error instanceof ConversationServiceError) {
      const statusCode = error.code === 'UNAUTHENTICATED' ? 401 : 
                         error.code === 'USER_NOT_FOUND' ? 403 : 
                         error.code === 'INVALID_ID' ? 400 : 
                         error.code === 'CONVERSATION_NOT_FOUND' ? 404 : 500;
      
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
        error: 'Failed to fetch conversation',
        message: error.message || 'Unknown error',
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
      },
      { status: 500 }
    );
  }
}

// PATCH /api/conversations/[id] - Update a conversation
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const conversationId = params.id;
  console.log(`PATCH /api/conversations/${conversationId} - Request received`);
  
  try {
    // Check if this is a local conversation ID
    if (conversationId.startsWith('local-')) {
      console.log(`PATCH /api/conversations/${conversationId} - Handling local conversation`);
      
      // For local conversations, just echo back the data with the ID
      let body;
      try {
        body = await req.json();
      } catch (parseError) {
        console.error(`PATCH /api/conversations/${conversationId} - JSON parse error:`, parseError);
        return NextResponse.json(
          { error: 'Invalid JSON in request body' },
          { status: 400 }
        );
      }
      
      const { title } = body;
      return NextResponse.json({
        id: conversationId,
        title: title || 'New conversation',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: []
      });
    }
    
    let session;
    try {
      session = await getServerSession(authOptions);
    } catch (sessionError) {
      console.error(`PATCH /api/conversations/${conversationId} - Session retrieval error:`, sessionError);
      return NextResponse.json(
        { error: 'Authentication service unavailable' },
        { status: 503 }
      );
    }
    
    if (!session?.user) {
      console.log(`PATCH /api/conversations/${conversationId} - No authenticated user found`);
      return NextResponse.json({ 
        error: 'Unauthorized',
        code: 'auth_required',
        message: 'You must be signed in to update this conversation'
      }, { status: 401 });
    }
    
    console.log(`PATCH /api/conversations/${conversationId} - Updating for user: ${session.user.email}`);
    
    let body;
    try {
      body = await req.json();
    } catch (parseError) {
      console.error(`PATCH /api/conversations/${conversationId} - JSON parse error:`, parseError);
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }
    
    const { title } = body;
    
    if (!title || typeof title !== 'string') {
      return NextResponse.json(
        { error: 'Title is required and must be a string', code: 'invalid_input' },
        { status: 400 }
      );
    }
    
    const conversation = await updateConversation(conversationId, { title });
    
    if (!conversation) {
      console.log(`PATCH /api/conversations/${conversationId} - Conversation not found`);
      return NextResponse.json({ 
        error: 'Conversation not found',
        code: 'not_found'
      }, { status: 404 });
    }
    
    return NextResponse.json(conversation);
  } catch (error: any) {
    console.error(`PATCH /api/conversations/${conversationId} - Error:`, error);
    
    // Handle specific error types
    if (error instanceof ConversationServiceError) {
      const statusCode = error.code === 'UNAUTHENTICATED' ? 401 : 
                         error.code === 'USER_NOT_FOUND' ? 403 : 
                         error.code === 'INVALID_ID' ? 400 : 
                         error.code === 'CONVERSATION_NOT_FOUND' ? 404 : 500;
      
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
        error: 'Failed to update conversation',
        message: error.message || 'Unknown error',
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
      },
      { status: 500 }
    );
  }
}

// DELETE /api/conversations/[id] - Delete a conversation
export async function DELETE(_: NextRequest, { params }: RouteParams) {
  const conversationId = params.id;
  console.log(`DELETE /api/conversations/${conversationId} - Request received`);
  
  try {
    // Check if this is a local conversation ID
    if (conversationId.startsWith('local-')) {
      console.log(`DELETE /api/conversations/${conversationId} - Handling local conversation`);
      // For local conversations, just return success
      return NextResponse.json({ success: true });
    }
    
    let session;
    try {
      session = await getServerSession(authOptions);
    } catch (sessionError) {
      console.error(`DELETE /api/conversations/${conversationId} - Session retrieval error:`, sessionError);
      return NextResponse.json(
        { error: 'Authentication service unavailable' },
        { status: 503 }
      );
    }
    
    if (!session?.user) {
      console.log(`DELETE /api/conversations/${conversationId} - No authenticated user found`);
      return NextResponse.json({ 
        error: 'Unauthorized',
        code: 'auth_required',
        message: 'You must be signed in to delete this conversation'
      }, { status: 401 });
    }
    
    console.log(`DELETE /api/conversations/${conversationId} - Deleting for user: ${session.user.email}`);
    
    const conversation = await deleteConversation(conversationId);
    
    if (!conversation) {
      console.log(`DELETE /api/conversations/${conversationId} - Conversation not found`);
      return NextResponse.json({ 
        error: 'Conversation not found',
        code: 'not_found'
      }, { status: 404 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error(`DELETE /api/conversations/${conversationId} - Error:`, error);
    
    // Handle specific error types
    if (error instanceof ConversationServiceError) {
      const statusCode = error.code === 'UNAUTHENTICATED' ? 401 : 
                         error.code === 'USER_NOT_FOUND' ? 403 : 
                         error.code === 'INVALID_ID' ? 400 : 
                         error.code === 'CONVERSATION_NOT_FOUND' ? 404 : 500;
      
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
        error: 'Failed to delete conversation',
        message: error.message || 'Unknown error',
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
      },
      { status: 500 }
    );
  }
} 