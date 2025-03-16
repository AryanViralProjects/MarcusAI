import { NextRequest, NextResponse } from 'next/server';
import { getUserConversations, createConversation } from '@/lib/conversation-service';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

// GET /api/conversations - Get all conversations for the current user
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const conversations = await getUserConversations();
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { title } = await req.json();
    const conversation = await createConversation(title);
    
    if (!conversation) {
      return NextResponse.json(
        { error: 'Failed to create conversation' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(conversation);
  } catch (error: any) {
    console.error('Error creating conversation:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create conversation' },
      { status: 500 }
    );
  }
} 