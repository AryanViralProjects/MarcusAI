import { NextRequest, NextResponse } from 'next/server';
import { getChatCompletion, Message as OpenAiMessage, ModelType, ToolType } from '@/lib/openai';
import { validateEnv } from '@/lib/config';
import { UserPreferences, defaultPreferences } from '@/lib/personalization';
import { Message, Attachment, Citation } from '@/types/chat';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { addMessageToConversation, createConversation } from '@/lib/conversation-service';

export async function POST(req: NextRequest) {
  try {
    // Validate environment variables
    validateEnv();
    
    const { messages, preferences = defaultPreferences, model = ModelType.GPT_4_5, tools = [], conversationId } = await req.json();

    console.log('Chat API - Request body:', { 
      messageCount: messages?.length, 
      model, 
      toolsReceived: tools,
      conversationId: conversationId || 'new'
    });

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

    console.log('Chat API - Latest user message:', latestUserMessage.content);

    // Get all messages including attachments for the API
    const chatHistory = messages
      .filter(m => m.role !== 'system')
      .map(m => {
        // Keep the original structure including attachments
        const mappedMessage: any = {
          role: m.role,
          content: m.content
        };

        // Include attachments for image processing by vision models
        if (m.attachments && m.attachments.length > 0) {
          mappedMessage.attachments = m.attachments;
          console.log(`Processing message with ${m.attachments.length} attachments`);
        }

        return mappedMessage;
      });

    console.log('Chat API - Model:', model);
    console.log('Chat API - Tools before filtering:', tools);

    // Check if the latest user message contains "performance marketing"
    if (latestUserMessage.content.toLowerCase().includes('performance marketing') && 
        !tools.includes(ToolType.FILE_SEARCH)) {
      console.log('Chat API - Detected "performance marketing", adding FILE_SEARCH tool');
      tools.push(ToolType.FILE_SEARCH);
    }

    // Generate response from OpenAI with user preferences
    const filteredTools = (tools as ToolType[]).filter(
      tool => tool !== ToolType.COMPUTER_USE
    );
    
    console.log('Chat API - Tools after filtering:', filteredTools);

    const response = await getChatCompletion(
      chatHistory, 
      model as ModelType,
      // Only filter out COMPUTER_USE tool as it's coming soon
      filteredTools
    );

    // Check if user is authenticated and save the conversation if they are
    const session = await getServerSession(authOptions);
    if (session?.user) {
      try {
        // Determine which conversation to use
        let activeConversationId = conversationId;
        
        // If no conversation ID was provided, create a new conversation
        if (!activeConversationId) {
          // Generate a title from the first user message
          const firstUserMessage = messages.find(m => m.role === 'user');
          const title = firstUserMessage ? 
            firstUserMessage.content.substring(0, 50) + (firstUserMessage.content.length > 50 ? '...' : '') : 
            'New conversation';
          
          const newConversation = await createConversation(title);
          if (newConversation) {
            activeConversationId = newConversation.id;
            // Add the conversation ID to the response
            (response as any).conversationId = activeConversationId;
          }
        }
        
        if (activeConversationId) {
          // Extract image URL from attachments for database storage
          let imageUrl: string | undefined;
          if (latestUserMessage.attachments && latestUserMessage.attachments.length > 0) {
            const firstImageAttachment = latestUserMessage.attachments.find(att => att.type === 'image');
            if (firstImageAttachment) {
              imageUrl = firstImageAttachment.url;
            }
          }
          
          // Save the user message
          await addMessageToConversation(activeConversationId, {
            role: latestUserMessage.role,
            content: latestUserMessage.content,
            // Add the first image URL if there are any image attachments
            imageUrl,
            // Handle citations if present
            citations: latestUserMessage.citations?.map(citation => ({
              title: citation.title,
              url: citation.url
            }))
          });
          
          // Save the assistant message
          await addMessageToConversation(activeConversationId, {
            role: response.role,
            content: response.content,
            // Handle citations if present
            citations: response.citations?.map((citation: Citation) => ({
              title: citation.title,
              url: citation.url
            }))
          });
        }
      } catch (dbError) {
        console.error('Error saving conversation to database:', dbError);
        // Continue with the response even if saving to DB fails
      }
    }

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Error in chat API:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate response' },
      { status: 500 }
    );
  }
}
