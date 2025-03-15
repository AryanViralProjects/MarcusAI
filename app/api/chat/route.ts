import { NextRequest, NextResponse } from 'next/server';
import { createChatCompletion, ChatMessage, ModelType, ToolType } from '@/lib/openai';
import { validateEnv } from '@/lib/config';
import { UserPreferences, defaultPreferences } from '@/lib/personalization';
import { Message, Attachment } from '@/types/chat';

export async function POST(req: NextRequest) {
  try {
    // Validate environment variables
    validateEnv();
    
    const { messages, preferences = defaultPreferences, model = ModelType.GPT_4_5_PREVIEW, tools = [] } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages are required and must be an array' },
        { status: 400 }
      );
    }

    // Extract the latest user message
    const latestUserMessage = messages.filter(m => m.role === 'user').pop() as Message | undefined;
    
    if (!latestUserMessage) {
      return NextResponse.json(
        { error: 'No user message found' },
        { status: 400 }
      );
    }

    // Process attachments if present
    let enhancedUserMessage = latestUserMessage.content;
    if (latestUserMessage.attachments && latestUserMessage.attachments.length > 0) {
      // Add attachment information to the message content
      const attachmentDescriptions = latestUserMessage.attachments.map((attachment: Attachment) => {
        if (attachment.type === 'image') {
          return `[Image: ${attachment.url}]`;
        } else {
          return `[Document: ${attachment.name} - ${attachment.url}]`;
        }
      });
      
      enhancedUserMessage = `${enhancedUserMessage}\n\nAttachments:\n${attachmentDescriptions.join('\n')}`;
    }

    // Get previous messages for context (excluding system messages)
    const chatHistory = messages
      .filter(m => m.role !== 'system')
      .map(m => {
        // Create a clean copy of the message without attachments for the API
        return {
          role: m.role,
          content: m.content
        } as ChatMessage;
      });

    console.log('Chat API - Model:', model);
    console.log('Chat API - Tools:', tools);

    // Generate response from OpenAI with user preferences
    const response = await createChatCompletion(
      enhancedUserMessage, 
      chatHistory, 
      preferences as UserPreferences,
      model as ModelType,
      tools as ToolType[]
    );

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Error in chat API:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate response' },
      { status: 500 }
    );
  }
}
