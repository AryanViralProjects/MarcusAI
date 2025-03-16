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
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { role, content, imageUrl, citations } = await req.json();
    
    if (!role || !content) {
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
      return NextResponse.json(
        { error: 'Failed to add message to conversation' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(message);
  } catch (error: any) {
    console.error('Error adding message to conversation:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to add message to conversation' },
      { status: 500 }
    );
  }
} 