import { NextRequest, NextResponse } from 'next/server';
import { getUserConversations, createConversation } from '@/lib/conversation-service';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

// GET /api/conversations - Get all conversations for the current user
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      console.log('GET /api/conversations - No authenticated user found');
      return NextResponse.json([], { status: 200 }); // Return empty array instead of error for unauthenticated users
    }
    
    console.log('GET /api/conversations - Fetching conversations for user:', session.user.email);
    const conversations = await getUserConversations();
    console.log(`GET /api/conversations - Found ${conversations.length} conversations`);
    
    return NextResponse.json(conversations);
  } catch (error: any) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch conversations' },
      { status: 500 }
    );
  }
}

// POST /api/conversations - Create a new conversation
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      console.log('POST /api/conversations - No authenticated user found');
      // Create a local conversation ID for unauthenticated users
      const localConversationId = `local-${Date.now()}`;
      return NextResponse.json({
        id: localConversationId,
        title: 'New conversation',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: []
      }, { status: 200 });
    }
    
    console.log('POST /api/conversations - Creating conversation for user:', session.user.email);
    const { title } = await req.json();
    const conversation = await createConversation(title);
    
    if (!conversation) {
      console.error('POST /api/conversations - Failed to create conversation');
      return NextResponse.json(
        { error: 'Failed to create conversation' },
        { status: 500 }
      );
    }
    
    console.log('POST /api/conversations - Created conversation with ID:', conversation.id);
    return NextResponse.json(conversation);
  } catch (error: any) {
    console.error('Error creating conversation:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create conversation' },
      { status: 500 }
    );
  }
} 