import { NextRequest, NextResponse } from 'next/server';
import { getConversation, updateConversation, deleteConversation } from '@/lib/conversation-service';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/conversations/[id] - Get a specific conversation
export async function GET(_: NextRequest, { params }: RouteParams) {
  try {
    // Check if this is a local conversation ID
    if (params.id.startsWith('local-')) {
      console.log('GET /api/conversations/[id] - Handling local conversation:', params.id);
      // Return an empty conversation structure for local conversations
      return NextResponse.json({
        id: params.id,
        title: 'New conversation',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: []
      });
    }
    
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      console.log('GET /api/conversations/[id] - No authenticated user found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    console.log(`GET /api/conversations/[id] - Fetching conversation ${params.id} for user: ${session.user.email}`);
    const conversation = await getConversation(params.id);
    
    if (!conversation) {
      console.log(`GET /api/conversations/[id] - Conversation ${params.id} not found`);
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }
    
    return NextResponse.json(conversation);
  } catch (error: any) {
    console.error('Error fetching conversation:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch conversation' },
      { status: 500 }
    );
  }
}

// PATCH /api/conversations/[id] - Update a conversation
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    // Check if this is a local conversation ID
    if (params.id.startsWith('local-')) {
      console.log('PATCH /api/conversations/[id] - Handling local conversation:', params.id);
      // For local conversations, just echo back the data with the ID
      const { title } = await req.json();
      return NextResponse.json({
        id: params.id,
        title: title || 'New conversation',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: []
      });
    }
    
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      console.log('PATCH /api/conversations/[id] - No authenticated user found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    console.log(`PATCH /api/conversations/[id] - Updating conversation ${params.id} for user: ${session.user.email}`);
    const { title } = await req.json();
    const conversation = await updateConversation(params.id, { title });
    
    if (!conversation) {
      console.log(`PATCH /api/conversations/[id] - Conversation ${params.id} not found`);
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }
    
    return NextResponse.json(conversation);
  } catch (error: any) {
    console.error('Error updating conversation:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update conversation' },
      { status: 500 }
    );
  }
}

// DELETE /api/conversations/[id] - Delete a conversation
export async function DELETE(_: NextRequest, { params }: RouteParams) {
  try {
    // Check if this is a local conversation ID
    if (params.id.startsWith('local-')) {
      console.log('DELETE /api/conversations/[id] - Handling local conversation:', params.id);
      // For local conversations, just return success
      return NextResponse.json({ success: true });
    }
    
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      console.log('DELETE /api/conversations/[id] - No authenticated user found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    console.log(`DELETE /api/conversations/[id] - Deleting conversation ${params.id} for user: ${session.user.email}`);
    const conversation = await deleteConversation(params.id);
    
    if (!conversation) {
      console.log(`DELETE /api/conversations/[id] - Conversation ${params.id} not found`);
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting conversation:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete conversation' },
      { status: 500 }
    );
  }
} 